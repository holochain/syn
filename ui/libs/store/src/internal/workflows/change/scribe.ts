import type {
  ChangeRequest,
  Delta,
  ChangeBundle,
  FolkChanges,
  EphemeralChanges,
} from '@syn/zome-client';
import type {
  EntryHashB64,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';

import type { ApplyDeltaFn } from '../../../apply-delta';
import {
  amIScribe,
  selectFolksInSession,
  selectLastDeltaSeen,
  selectSessionState,
} from '../../../state/selectors';
import type { SessionState } from '../../../state/syn-state';
import type { SynWorkspace } from '../../workspace';
import { putJustSeenFolks } from '../folklore/utils';
import { commitChanges } from '../commit/scribe';

export function scribeRequestChange<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  deltas: DELTA[],
  ephemeralChanges: EphemeralChanges | undefined
) {
  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);
    const changeBundle = putDeltas(
      workspace.applyDeltaFn,
      sessionState,
      state.myPubKey,
      sessionState.myFolkIndex,
      deltas
    );

    sessionState.ephemeral = {
      ...sessionState.ephemeral,
      ...ephemeralChanges,
    };

    workspace.client.sendChange({
      participants: selectFolksInSession(sessionState),
      sessionHash,
      lastDeltaSeen: selectLastDeltaSeen(sessionState),
      deltaChanges: changeBundle,
      ephemeralChanges: ephemeralChanges,
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

export function handleChangeRequest<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
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

    putJustSeenFolks(sessionState, state.myPubKey, [changeRequest.folk]);

    const lastDeltaSeen = selectLastDeltaSeen(sessionState);

    if (
      lastDeltaSeen.commitHash !== changeRequest.lastDeltaSeen.commitHash ||
      changeRequest.lastDeltaSeen.deltaIndexInCommit !==
        lastDeltaSeen.deltaIndexInCommit
    ) {
      console.warn('Scribe is receiving change out of order!');
      // change is too late, nextIndex has moved on
      // TODO: rebase? notify sender?
      return state;
    }

    let changeBundle: ChangeBundle | undefined;

    if (changeRequest.deltaChanges) {
      changeBundle = putDeltas(
        workspace.applyDeltaFn,
        sessionState,
        changeRequest.folk,
        changeRequest.deltaChanges.atFolkIndex,
        changeRequest.deltaChanges.deltas
      );
    }

    sessionState.ephemeral = {
      ...sessionState.ephemeral,
      ...changeRequest.ephemeralChanges,
    };

    workspace.client.sendChange({
      deltaChanges: changeBundle,
      ephemeralChanges: changeRequest.ephemeralChanges,
      lastDeltaSeen,
      participants: selectFolksInSession(sessionState),
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

function triggerCommitIfNecessary<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
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

function putDeltas<CONTENT, DELTA>(
  applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>,
  session: SessionState,
  author: AgentPubKeyB64,
  atFolkIndex: number,
  deltas: Delta[]
): ChangeBundle {
  const currentCommitIndex = session.uncommittedChanges.deltas.length;

  // Immediately update the contents of the session
  session.uncommittedChanges.deltas = [
    ...session.uncommittedChanges.deltas,
    ...deltas,
  ];

  let currentContent = session.currentContent;
  for (const delta of deltas) {
    currentContent = applyDeltaFn(currentContent, delta);
  }
  session.currentContent = currentContent;

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

  return {
    deltas,
    authors: {
      [author]: folkChanges,
    },
  };
}
