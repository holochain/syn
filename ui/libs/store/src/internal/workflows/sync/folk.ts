import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import {
  BinarySyncMessage,
  clone,
  generateSyncMessage,
  receiveSyncMessage,
} from 'automerge';

import type { SynWorkspace } from '../../workspace';
import type { SynGrammar } from '../../../grammar';

export function handleSyncResponse<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  syncMessage: BinarySyncMessage
) {
  let resolveJoining: (() => void) | undefined = undefined;
  workspace.store.update(state => {
    const joiningSession = state.joiningSessions[sessionHash];
    if (joiningSession) {
      const [nextDoc, nextSyncState, _patch] = receiveSyncMessage(
        joiningSession.currentContent,
        joiningSession.scribeSyncState,
        syncMessage
      );
      joiningSession.currentContent = nextDoc;
      const [nextnextSyncState, nextsyncMessage] = generateSyncMessage(
        nextDoc,
        nextSyncState
      );

      joiningSession.scribeSyncState = nextnextSyncState;

      const scribe = state.sessions[sessionHash].scribe;
      if (nextsyncMessage) {
        workspace.client.sendSyncRequest({
          scribe,
          sessionHash,
          syncMessage: nextsyncMessage,
        });
      } else {
        state.joinedSessions[sessionHash] = {
          sessionHash: sessionHash,
          currentContent: nextDoc,
          initialSnapshot: clone(nextDoc),
          lastCommitHash: undefined,
          syncStates: {
            [scribe]: joiningSession.scribeSyncState,
          },
          unpublishedChanges: [],

          folks: {},
        };

        resolveJoining = state.joiningSessions[sessionHash].promise;
        delete state.joiningSessions[sessionHash];
      }
    }

    return state;
  });
  if (resolveJoining) (resolveJoining as any)();
}
