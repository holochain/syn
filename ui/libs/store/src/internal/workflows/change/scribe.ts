import type { ChangeRequest } from '@holochain-syn/client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';

import {
  amIScribe,
  selectFolksInSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import { commitChanges, commitLock } from '../commit/scribe';
import type { GrammarDelta, GrammarState, SynGrammar } from '../../../grammar';
import {
  applyChanges,
  change,
  FreezeObject,
  getChanges,
  load,
  clone,
} from 'automerge';

export async function scribeRequestChange<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  deltas: Array<GrammarDelta<G>>
) {
  await commitLock;

  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);

    const oldContent = clone(sessionState.currentContent);

    for (const delta of deltas) {
      sessionState.currentContent = change(sessionState.currentContent, doc =>
        workspace.grammar.applyDelta(doc, delta, workspace.myPubKey)
      );
    }

    const changes = getChanges(oldContent, sessionState.currentContent);

    workspace.client.sendChange({
      deltas: changes,
      participants: selectFolksInSession(workspace, sessionState),
      sessionHash,
    });

    let lastCommitState: FreezeObject<GrammarState<G>> =
      sessionState.initialSnapshot;
    if (sessionState.lastCommitHash) {
      const commit = state.commits[sessionState.lastCommitHash];

      lastCommitState = load(state.snapshots[commit.newContentHash]);
    }

    const commitChanges = getChanges(
      lastCommitState,
      sessionState.currentContent
    );

    triggerCommitIfNecessary(workspace, sessionHash, commitChanges.length);

    return state;
  });
}

export async function handleChangeRequest<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  changeRequest: ChangeRequest
) {
  await commitLock;

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

    const changes = applyChanges(
      sessionState.currentContent,
      changeRequest.deltas
    );
    sessionState.currentContent = changes[0];

    workspace.client.sendChange({
      deltas: changeRequest.deltas,
      participants: selectFolksInSession(workspace, sessionState),
      sessionHash,
    });

    let lastCommitState: FreezeObject<GrammarState<G>> =
      sessionState.initialSnapshot;
    if (sessionState.lastCommitHash) {
      const commit = state.commits[sessionState.lastCommitHash];

      lastCommitState = load(state.snapshots[commit.newContentHash]);
    }

    const changesSinceCommit = getChanges(
      lastCommitState,
      sessionState.currentContent
    );

    triggerCommitIfNecessary(workspace, sessionHash, changesSinceCommit.length);

    return state;
  });
}

function triggerCommitIfNecessary<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  uncommittedChangesCount: number
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
