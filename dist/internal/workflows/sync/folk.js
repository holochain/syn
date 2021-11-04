import { merge } from "lodash-es";
import { selectLatestCommittedContentHash, selectSessionWorkspace, } from "../../../state/selectors";
import { orderCommits, applyCommits, applyChangeBundle } from "../../utils";
export function handleSyncResponse(workspace, sessionHash, stateForSync) {
    workspace.store.update((state) => {
        const sessionWorkspace = selectSessionWorkspace(state, sessionHash);
        // Put the missed commits in the state
        const latestCommittedContentHash = selectLatestCommittedContentHash(state, sessionHash);
        const missedCommitHashes = orderCommits(latestCommittedContentHash, stateForSync.missedCommits);
        for (const missedCommitHash of missedCommitHashes) {
            state.commits[missedCommitHash] =
                stateForSync.missedCommits[missedCommitHash];
        }
        sessionWorkspace.commitHashes = [
            ...sessionWorkspace.commitHashes,
            ...missedCommitHashes,
        ];
        // Put the uncommitted changes in the state
        const uncommittedChanges = sessionWorkspace.uncommittedChanges;
        const lastSeenIndex = uncommittedChanges.atSessionIndex + uncommittedChanges.deltas.length;
        if (lastSeenIndex !== stateForSync.uncommittedChanges.atSessionIndex)
            throw new Error(`I requested changes from session index ${lastSeenIndex} and received changes from ${stateForSync.uncommittedChanges.atSessionIndex}`);
        uncommittedChanges.deltas = [
            ...uncommittedChanges.deltas,
            ...stateForSync.uncommittedChanges.deltas,
        ];
        uncommittedChanges.authors = merge(uncommittedChanges.authors, stateForSync.uncommittedChanges.authors);
        // Apply all deltas
        const commitArray = missedCommitHashes.map((missedCommitHash) => stateForSync.missedCommits[missedCommitHash]);
        let currentContent = applyCommits(sessionWorkspace.currentContent, workspace.applyDeltaFn, commitArray);
        sessionWorkspace.currentContent = applyChangeBundle(currentContent, workspace.applyDeltaFn, stateForSync.uncommittedChanges);
        return state;
    });
}
//# sourceMappingURL=folk.js.map