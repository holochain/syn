import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import {
  BinarySyncMessage,
  generateSyncMessage,
  receiveSyncMessage,
} from 'automerge';

import type { SynWorkspace } from '../../workspace';
import type { SynGrammar } from '../../../grammar';
import { selectSession, selectSessionState } from '../../../state/selectors';

export function handleSyncResponse<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  syncMessage: BinarySyncMessage
) {
  let resolveJoining: (() => void) | undefined = undefined;
  workspace.store.update(state => {
    const joiningSession = state.joiningSessionsPromises[sessionHash];
    if (joiningSession !== undefined) {
      const session = selectSession(state, sessionHash);
      const sessionState = selectSessionState(state, sessionHash);

      const [nextDoc, nextSyncState, _patch] = receiveSyncMessage(
        sessionState.state,
        sessionState.syncStates[session.scribe].state,
        syncMessage
      );
      sessionState.state = nextDoc;
      const [nextnextSyncState, nextsyncMessage] = generateSyncMessage(
        nextDoc,
        nextSyncState
      );
      sessionState.syncStates[session.scribe].state = nextnextSyncState;

      const [ephemeralNextDoc, ephemeralNextSyncState, _ephemeralPatch] =
        receiveSyncMessage(
          sessionState.state,
          sessionState.syncStates[session.scribe].ephemeral,
          syncMessage
        );
      sessionState.state = ephemeralNextDoc;
      const [
        ephemeralNextephemeralNextSyncState,
        ephemeralNextNextSyncMessage,
      ] = generateSyncMessage(ephemeralNextDoc, ephemeralNextSyncState);
      sessionState.syncStates[session.scribe].ephemeral =
        ephemeralNextephemeralNextSyncState;

      const scribe = state.sessions[sessionHash].scribe;
      if (nextsyncMessage || ephemeralNextNextSyncMessage) {
        workspace.client.sendSyncRequest({
          scribe,
          sessionHash,
          syncMessage: nextsyncMessage,
          ephemeralSyncMessage: ephemeralNextNextSyncMessage,
        });
      } else {
        resolveJoining = state.joiningSessionsPromises[sessionHash];
        delete state.joiningSessionsPromises[sessionHash];
      }
    }

    return state;
  });
  if (resolveJoining) (resolveJoining as any)();
}
