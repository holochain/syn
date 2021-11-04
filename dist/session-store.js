import { derived, get } from 'svelte/store';
import { selectSessionWorkspace } from './state/selectors';
import { requestChange } from './internal/workflows/change';
export function buildSessionStore(workspace, sessionHash) {
    const content = derived(workspace.store, state => selectSessionWorkspace(state, sessionHash).currentContent);
    const folks = derived(workspace.store, state => selectSessionWorkspace(state, sessionHash).folks);
    const state = get(workspace.store);
    const myPubKey = state.myPubKey;
    const session = state.sessions[sessionHash];
    return {
        sessionHash: sessionHash,
        session,
        content,
        folks,
        requestChange: deltas => requestChange(workspace, sessionHash, deltas),
        leave: async () => {
            if (session.scribe === myPubKey) {
                await workspace.client.deleteSession(sessionHash);
                workspace.store.update(state => {
                    state.joinedSessions[sessionHash] = undefined;
                    delete state.joinedSessions[sessionHash];
                    return state;
                });
            }
        },
    };
}
//# sourceMappingURL=session-store.js.map