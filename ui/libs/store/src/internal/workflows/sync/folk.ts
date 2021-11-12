import type { StateForSync } from '@syn/zome-client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import merge from 'lodash-es/merge';

import { selectSessionState } from '../../../state/selectors';
import { applyChangeBundle } from '../../utils';
import type { SynWorkspace } from '../../workspace';
import cloneDeep from 'lodash-es/cloneDeep';

export function handleSyncResponse<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  stateForSync: StateForSync
) {
  let resolveJoining: (() => void) | undefined = undefined;
  workspace.store.update(state => {
    if (state.joiningSessions[sessionHash]) {
      const currentCommitHash = stateForSync.folkMissedLastCommit
        ? stateForSync.folkMissedLastCommit.commitHash
        : undefined;
      state.joinedSessions[sessionHash] = {
        currentCommitHash,
        sessionHash: sessionHash,
        currentContent: cloneDeep(workspace.initialSnapshot),
        myFolkIndex: 0,
        prerequestContent: undefined,
        requestedChanges: [],
        ephemeral: {},
        uncommittedChanges: {
          authors: {},
          deltas: [],
        },
        folks: {},
      };

      resolveJoining = state.joiningSessions[sessionHash];
      delete state.joiningSessions[sessionHash];
    }

    const sessionState = selectSessionState(state, sessionHash);

    // Put the missed commit in the state
    const missedCommit = stateForSync.folkMissedLastCommit;

    if (missedCommit) {
      state.commits[missedCommit.commitHash] = missedCommit.commit;
      state.snapshots[missedCommit.commit.newContentHash] =
        missedCommit.commitInitialSnapshot;
      sessionState.currentCommitHash = missedCommit.commitHash;
      sessionState.uncommittedChanges = {
        authors: {},
        deltas: [],
      };
      sessionState.currentContent = missedCommit.commitInitialSnapshot;
    }

    // Put the uncommitted changes in the state
    const uncommittedChanges = sessionState.uncommittedChanges;

    uncommittedChanges.deltas = [
      ...uncommittedChanges.deltas,
      ...stateForSync.uncommittedChanges.deltas,
    ];
    uncommittedChanges.authors = merge(
      uncommittedChanges.authors,
      stateForSync.uncommittedChanges.authors
    );

    // Apply all deltas
    sessionState.currentContent = applyChangeBundle(
      sessionState.currentContent,
      workspace.applyDeltaFn,
      stateForSync.uncommittedChanges
    );

    sessionState.ephemeral = stateForSync.ephemeralChanges;
    return state;
  });
  if (resolveJoining) (resolveJoining as any)();
}
