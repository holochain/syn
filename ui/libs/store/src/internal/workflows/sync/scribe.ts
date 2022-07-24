import type { RequestSyncInput } from '@holochain-syn/client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';

import {
  amIScribe,
  selectFolksInSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import type { SynGrammar } from '../../../grammar';
import {
  generateSyncMessage,
  initSyncState,
  receiveSyncMessage,
} from 'automerge';

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

export function handleSyncRequest<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  requestSyncInput: RequestSyncInput
): void {
  workspace.store.update(synState => {
    if (!amIScribe(synState, sessionHash)) {
      console.log("syncReq received but I'm not the scribe!");
      return synState;
    }

    const sessionState = selectSessionState(synState, sessionHash);
    
    sessionState.folks[requestSyncInput.folk] = {
      lastSeen: Date.now(),
    };

    sessionState.syncStates[requestSyncInput.folk] = initSyncState();

    const [nextDoc, nextSyncState, _message] = receiveSyncMessage(
      sessionState.currentContent,
      sessionState.syncStates[requestSyncInput.folk],
      requestSyncInput.syncMessage
    );
    sessionState.syncStates[requestSyncInput.folk] = nextSyncState;

    sessionState.currentContent = nextDoc;

    const [nextState, syncMessage] = generateSyncMessage(
      sessionState.currentContent,
      sessionState.syncStates[requestSyncInput.folk]
    );
    sessionState.syncStates[requestSyncInput.folk] = nextState;

    workspace.client.sendSyncResponse({
      syncMessage: syncMessage!,
      sessionHash: sessionHash,
      participant: requestSyncInput.folk,
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
