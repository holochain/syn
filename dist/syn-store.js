import { derived, writable } from 'svelte/store';
import { serializeHash } from '@holochain-open-dev/core-types';
import { SynClient } from '@syn/zome-client';
import { merge } from 'lodash-es';
import { initialState } from './state/syn-state';
import { handleSignal } from './internal/signals';
import { defaultConfig } from './config';
import { initBackgroundTasks } from './internal/tasks';
import { joinSession } from './internal/workflows/sessions/folk';
import { buildSessionStore } from './session-store';
import { newSession } from './internal/workflows/sessions/scribe';
export function createSynStore(cellClient, initialContent, applyDeltaFn, config) {
    let workspace = undefined;
    const fullConfig = merge(config, defaultConfig());
    const myPubKey = serializeHash(cellClient.cellId[1]);
    const state = initialState(myPubKey);
    const store = writable(state);
    const client = new SynClient(cellClient, signal => handleSignal(workspace, signal));
    workspace = {
        store,
        applyDeltaFn,
        client,
        initialContent,
        config: fullConfig,
    };
    const { cancel } = initBackgroundTasks(workspace);
    const activeSession = derived(store, state => {
        if (state.activeSessionHash)
            return buildSessionStore(workspace, state.activeSessionHash);
    });
    return {
        myPubKey,
        getAllSessions: async () => {
            const sessions = await client.getSessions();
            workspace.store.update(state => {
                state.sessions = Object.assign(Object.assign({}, state.sessions), sessions);
                return state;
            });
            return sessions;
        },
        joinSession: async (sessionHash) => joinSession(workspace, sessionHash),
        activeSession,
        joinedSessions: derived(workspace.store, state => Object.keys(state.joinedSessions)),
        knownSessions: derived(workspace.store, state => state.sessions),
        sessionStore: sessionHash => buildSessionStore(workspace, sessionHash),
        newSession: async (fromSnapshot) => newSession(workspace, fromSnapshot),
        close: async () => {
            client.close();
            cancel();
        },
    };
}
//# sourceMappingURL=syn-store.js.map