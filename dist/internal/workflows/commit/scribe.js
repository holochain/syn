import { get } from 'svelte/store';
import { amIScribe, selectFolksInSession, selectSessionWorkspace, } from '../../../state/selectors';
import { buildCommitFromUncommitted, putNewCommit } from './utils';
export async function commitChanges(workspace, sessionHash) {
    const state = get(workspace.store);
    if (!amIScribe(state, sessionHash)) {
        console.log("Trying to commit the changes but I'm not the scribe!");
        return state;
    }
    let session = selectSessionWorkspace(state, sessionHash);
    const hash = await workspace.client.hashContent(session.currentContent);
    const commit = buildCommitFromUncommitted(state, sessionHash, hash);
    const commitInput = {
        commit,
        participants: selectFolksInSession(session),
        sessionHash,
        sessionSnapshot: state.sessions[sessionHash].snapshotHash,
    };
    const newCommitHash = await workspace.client.commit(commitInput);
    // TODO: what happens if we have a new change while committing?
    workspace.store.update(state => {
        putNewCommit(state, sessionHash, newCommitHash, commit);
        return state;
    });
}
//# sourceMappingURL=scribe.js.map