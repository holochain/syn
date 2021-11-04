import { selectLatestCommitHash, selectLatestCommittedContentHash, selectSessionWorkspace, } from "../../../state/selectors";
export function buildCommitFromUncommitted(state, sessionHash, newContentHash) {
    const session = selectSessionWorkspace(state, sessionHash);
    const lastCommitHash = selectLatestCommitHash(session);
    return {
        changes: session.uncommittedChanges,
        newContentHash,
        previousCommitHashes: lastCommitHash ? [lastCommitHash] : [],
        previousContentHash: selectLatestCommittedContentHash(state, sessionHash),
        createdAt: Date.now(),
        meta: {
            appSpecific: null,
            witnesses: [],
        },
    };
}
export function putNewCommit(state, sessionHash, newCommitHash, commit) {
    state.commits[newCommitHash] = commit;
    const session = selectSessionWorkspace(state, sessionHash);
    session.commitHashes.push(newCommitHash);
    const newSessionIndex = commit.changes.atSessionIndex + commit.changes.deltas.length;
    session.uncommittedChanges = {
        atSessionIndex: newSessionIndex,
        authors: {},
        deltas: [],
    };
}
//# sourceMappingURL=utils.js.map