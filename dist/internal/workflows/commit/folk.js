import { amIScribe, selectLatestCommittedContentHash, selectSessionWorkspace, } from "../../../state/selectors";
import { buildCommitFromUncommitted, putNewCommit } from "./utils";
export function handleCommitNotice(workspace, sessionHash, commitNotice) {
    workspace.store.update((state) => {
        if (amIScribe(state, sessionHash)) {
            console.log("Received a commit notice but I'm the scribe!");
            return state;
        }
        const latestCommittedContentHash = selectLatestCommittedContentHash(state, sessionHash);
        const session = selectSessionWorkspace(state, sessionHash);
        if (latestCommittedContentHash === commitNotice.previousContentHash &&
            commitNotice.committedDeltasCount ===
                session.uncommittedChanges.deltas.length) {
            const commit = buildCommitFromUncommitted(state, sessionHash, commitNotice.newContentHash);
            putNewCommit(state, sessionHash, commitNotice.commitHash, commit);
        }
        else {
            // TODO: resync
        }
        return state;
    });
}
//# sourceMappingURL=folk.js.map