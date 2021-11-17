import type {
  ChangeRequest,
  ChangeBundle,
  FolkChanges,
  AuthoredDelta,
} from '@syn/zome-client';
import type {
  EntryHashB64,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';

import {
  amIScribe,
  selectFolksInSession,
  selectLastDeltaSeen,
  selectSessionState,
} from '../../../state/selectors';
import type { SessionState } from '../../../state/syn-state';
import type { SynWorkspace } from '../../workspace';
import { commitChanges } from '../commit/scribe';
import merge from 'lodash-es/merge';
import type { GrammarDelta, SynGrammar } from '../../../grammar';

export function scribeRequestChange<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  deltas: Array<GrammarDelta<G>>
) {
  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);

    const changeBundle = putDeltas(
      workspace.grammar,
      sessionState,
      state.myPubKey,
      sessionState.myFolkIndex,
      deltas
    );

    workspace.client.sendChange({
      participants: selectFolksInSession(workspace, sessionState),
      sessionHash,
      lastDeltaSeen: selectLastDeltaSeen(sessionState),
      deltaChanges: changeBundle,
    });

    triggerCommitIfNecessary(
      workspace,
      sessionHash,
      sessionState.uncommittedChanges.deltas.length
    );

    sessionState.myFolkIndex += deltas.length;
    return state;
  });
}

export function handleChangeRequest<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  changeRequest: ChangeRequest
) {
  workspace.store.update(state => {
    if (!amIScribe(state, sessionHash)) {
      console.warn(
        `Received a change request but I'm not the scribe for this session`
      );
      return state;
    }

    const sessionState = selectSessionState(state, sessionHash);

    sessionState.folks[changeRequest.folk] = {
      lastSeen: Date.now(),
    };

    const lastDeltaSeen = selectLastDeltaSeen(sessionState);

    if (
      lastDeltaSeen.commitHash != changeRequest.lastDeltaSeen.commitHash ||
      changeRequest.lastDeltaSeen.deltaIndexInCommit !==
        lastDeltaSeen.deltaIndexInCommit
    ) {
      console.warn('Scribe is receiving change out of order!');
      // change is too late, nextIndex has moved on
      // TODO: rebase? notify sender?
      return state;
    }

    let changeBundle = putDeltas(
      workspace.grammar,
      sessionState,
      changeRequest.folk,
      changeRequest.deltaChanges.atFolkIndex,
      changeRequest.deltaChanges.deltas
    );

    workspace.client.sendChange({
      deltaChanges: changeBundle,
      lastDeltaSeen,
      participants: selectFolksInSession(workspace, sessionState),
      sessionHash,
    });

    triggerCommitIfNecessary(
      workspace,
      sessionHash,
      sessionState.uncommittedChanges.deltas.length
    );

    return state;
  });
}

function triggerCommitIfNecessary<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  uncommittedChangesCount
) {
  if (
    (workspace.config.commitStrategy as { CommitEveryNDeltas: number })
      .CommitEveryNDeltas &&
    (workspace.config.commitStrategy as { CommitEveryNDeltas: number })
      .CommitEveryNDeltas <= uncommittedChangesCount
  ) {
    commitChanges(workspace, sessionHash);
  }
}

function putDeltas<G extends SynGrammar<any, any>>(
  grammar: G,
  sessionState: SessionState<G>,
  author: AgentPubKeyB64,
  atFolkIndex: number,
  deltas: Array<GrammarDelta<G>>
): ChangeBundle {
  const currentCommitIndex = sessionState.uncommittedChanges.deltas.length;
  const authoredDeltas: Array<AuthoredDelta> = deltas.map(d => ({
    author,
    delta: d,
  }));

  // Immediately update the contents of the session
  sessionState.uncommittedChanges.deltas = [
    ...sessionState.uncommittedChanges.deltas,
    ...authoredDeltas,
  ];

  let currentContent = sessionState.currentContent;
  for (const delta of authoredDeltas) {
    currentContent = grammar.applyDelta(
      currentContent,
      delta.delta,
      delta.author
    );
  }
  sessionState.currentContent = currentContent;

  // Build the change bundle
  const authorChanges: number[] = [];
  for (
    let i = currentCommitIndex;
    i < currentCommitIndex + deltas.length;
    i++
  ) {
    authorChanges.push(i);
  }
  const folkChanges: FolkChanges = {
    atFolkIndex,
    commitChanges: authorChanges,
  };
  const authors = {
    [author]: folkChanges,
  };

  sessionState.uncommittedChanges.authors = merge(
    sessionState.uncommittedChanges.authors,
    authors
  );

  return {
    deltas: authoredDeltas,
    authors,
  };
}
