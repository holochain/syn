import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import {
  BinarySyncMessage,
  generateSyncMessage,
  initSyncState,
  receiveSyncMessage,
} from 'automerge';
import { RequestSyncInput } from '@holochain-syn/client';

import type { SynWorkspace } from '../../workspace';
import type { SynGrammar } from '../../../grammar';
import {
  selectFolksInSession,
  selectSession,
  selectSessionState,
} from '../../../state/selectors';

export function requestSync<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  syncWith: AgentPubKeyB64
): void {
  workspace.store.update(state => {
    const session = selectSession(state, sessionHash);
    const sessionState = selectSessionState(state, sessionHash);

    const syncState = sessionState.syncStates[syncWith];

    const [nextSyncState, syncMessage] = generateSyncMessage(
      sessionState.state,
      syncState.state
    );
    const [ephemeralNextSyncState, ephemeralSyncMessage] = generateSyncMessage(
      sessionState.ephemeral,
      syncState.ephemeral
    );

    sessionState.syncStates[syncWith].state = nextSyncState;
    sessionState.syncStates[syncWith].ephemeral = ephemeralNextSyncState;

    workspace.client.sendSyncRequest({
      scribe: session.scribe,
      sessionHash: sessionHash,
      syncMessage: syncMessage!,
      ephemeralSyncMessage: ephemeralSyncMessage,
    });

    return state;
  });
}

export function handleSyncRequest<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  requestSyncInput: RequestSyncInput
): void {
  workspace.store.update(synState => {
    const sessionState = selectSessionState(synState, sessionHash);

    sessionState.folks[requestSyncInput.folk] = {
      lastSeen: Date.now(),
    };

    sessionState.syncStates[requestSyncInput.folk] = {
      state: initSyncState(),
      ephemeral: initSyncState(),
    };

    let syncMessage: BinarySyncMessage | undefined;
    let ephemeralSyncMessage: BinarySyncMessage | undefined;

    if (requestSyncInput.syncMessage) {
      const [nextDoc, nextSyncState, _message] = receiveSyncMessage(
        sessionState.state,
        sessionState.syncStates[requestSyncInput.folk].state,
        requestSyncInput.syncMessage
      );
      sessionState.syncStates[requestSyncInput.folk].state = nextSyncState;
      sessionState.state = nextDoc;

      const m = generateSyncMessage(
        sessionState.state,
        sessionState.syncStates[requestSyncInput.folk].state
      );
      sessionState.syncStates[requestSyncInput.folk].state = m[0];
      syncMessage = m[1];
    }

    if (requestSyncInput.ephemeralSyncMessage) {
      const [nextDoc, nextSyncState, _message] = receiveSyncMessage(
        sessionState.ephemeral,
        sessionState.syncStates[requestSyncInput.folk].ephemeral,
        requestSyncInput.ephemeralSyncMessage
      );
      sessionState.syncStates[requestSyncInput.folk].ephemeral = nextSyncState;
      sessionState.ephemeral = nextDoc;

      const m = generateSyncMessage(
        sessionState.ephemeral,
        sessionState.syncStates[requestSyncInput.folk].ephemeral
      );
      sessionState.syncStates[requestSyncInput.folk].ephemeral = m[0];
      ephemeralSyncMessage = m[1];
    }

    workspace.client.sendSyncResponse({
      syncMessage,
      ephemeralSyncMessage,
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

export function handleSyncResponse<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  syncMessage: BinarySyncMessage
) {
  let resolveJoining: (() => void) | undefined = undefined;
  workspace.store.update(state => {
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
    const [ephemeralNextephemeralNextSyncState, ephemeralNextNextSyncMessage] =
      generateSyncMessage(ephemeralNextDoc, ephemeralNextSyncState);
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
    } else if (state.joiningSessionsPromises[sessionHash] !== undefined) {
      resolveJoining = state.joiningSessionsPromises[sessionHash];
      delete state.joiningSessionsPromises[sessionHash];
    }

    return state;
  });
  if (resolveJoining) (resolveJoining as any)();
}
