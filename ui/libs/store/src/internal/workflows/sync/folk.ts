import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import {
  initSyncState,
  BinarySyncMessage,
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
      const [nextDoc, nextSyncState, patch] = receiveSyncMessage(
        joiningSession.currentContent,
        initSyncState(),
        syncMessage
      );

      state.joinedSessions[sessionHash] = {
        sessionHash: sessionHash,
        currentContent: nextDoc,
        lastCommitHash: undefined,
        syncStates: {},
        unpublishedChanges: [],

        folks: {},
      };

      resolveJoining = state.joiningSessions[sessionHash].promise;
      delete state.joiningSessions[sessionHash];
    }

    return state;
  });
  if (resolveJoining) (resolveJoining as any)();
}
