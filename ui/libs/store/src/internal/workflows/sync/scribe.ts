import type {
  MissedCommit,
  RequestSyncInput,
  StateForSync,
} from '@syn/zome-client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';

import {
  amIScribe,
  selectFolksInSession,
  selectMissedUncommittedChanges,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import type { SessionState } from '../../../state/syn-state';

/**
 * Scribe is managing the session, a folk comes in:
 *
 * - Folk: `SyncRequest`
 *     "Hey scribe! So I think I'm out of date and I don't know all the latest changes.
 *      This is the latest changes I've seen... Help me please?"
 * - Scribe: `SyncResponse`
 *     "Oh sure! Here is the last commit we are working from, and here are the
 *      uncommitted changes on top of it. From now on I'll update you whenever a change happens."
 *
 */

export function handleSyncRequest<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  requestSyncInput: RequestSyncInput
): void {
  workspace.store.update(synState => {
    if (!amIScribe(synState, sessionHash)) {
      console.log("syncReq received but I'm not the scribe!");
      return synState;
    }

    const sessionState = selectSessionState(
      synState,
      sessionHash
    ) as SessionState;

    sessionState.folks[requestSyncInput.folk] = {
      lastSeen: Date.now(),
    };

    let missedCommit: MissedCommit | undefined;

    if (
      (!requestSyncInput.lastDeltaSeen ||
        requestSyncInput.lastDeltaSeen.commitHash !==
          sessionState.currentCommitHash) &&
      sessionState.currentCommitHash
    ) {
      const commit = synState.commits[sessionState.currentCommitHash];

      missedCommit = {
        commit,
        commitHash: sessionState.currentCommitHash,
        commitInitialSnapshot: synState.snapshots[commit.newContentHash],
      };
    }

    const uncommittedChanges = selectMissedUncommittedChanges(
      synState,
      sessionHash,
      requestSyncInput.lastDeltaSeen
    );

    const syncState: StateForSync = {
      uncommittedChanges,
      folkMissedLastCommit: missedCommit,
      ephemeralChanges: sessionState.ephemeral,
      //currentContentHash:
    };

    workspace.client.sendSyncResponse({
      participant: requestSyncInput.folk,
      state: syncState,
      sessionHash,
    });

    const participants = selectFolksInSession(workspace, sessionState);

    workspace.client.sendFolkLore({
      participants,
      sessionHash,
      folkLore: sessionState.folks,
    });
    return synState;
  });
}
