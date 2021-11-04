export function amIScribe(synState, sessionHash) {
    return selectScribe(synState, sessionHash) === synState.myPubKey;
}
export function selectScribe(synState, sessionHash) {
    const session = synState.sessions[sessionHash];
    return session.scribe;
}
export function selectSessionWorkspace(synState, sessionHash) {
    return synState.joinedSessions[sessionHash];
}
export function selectLastCommitTime(state, sessionHash) {
    const commit = selectLatestCommit(state, sessionHash);
    if (commit)
        return commit.createdAt;
    else
        return state.sessions[sessionHash].createdAt;
}
export function selectLatestCommit(state, sessionHash) {
    const commitHash = selectLatestCommitHash(selectSessionWorkspace(state, sessionHash));
    return commitHash ? state.commits[commitHash] : undefined;
}
export function selectLatestCommitHash(session) {
    if (session.commitHashes.length === 0)
        return undefined;
    return session.commitHashes[session.commitHashes.length - 1];
}
export function selectLatestCommittedContentHash(synState, sessionHash) {
    const latestCommit = selectLatestCommit(synState, sessionHash);
    if (latestCommit)
        return latestCommit.newContentHash;
    // If there is no commit after the initial snapshot,
    // the last committed entry hash is the initial snapshot hash
    return synState.sessions[sessionHash].snapshotHash;
}
export function selectAllCommits(synState, sessionHash) {
    const session = synState.joinedSessions[sessionHash];
    console.log(synState);
    return session.commitHashes.map((hash) => [hash, synState.commits[hash]]);
}
// Returns the commits that have been missed since the last session change seen
export function selectMissedCommits(synState, sessionHash, latestSeenSessionIndex) {
    const commits = selectAllCommits(synState, sessionHash);
    const missedCommits = {};
    // Traverse the commits in reverse order, and when we find one that has already been seen, return
    for (const commit of commits.reverse()) {
        if (commit[1].changes.atSessionIndex > latestSeenSessionIndex) {
            missedCommits[commit[0]] = commit[1];
        }
        else {
            return missedCommits;
        }
    }
    return missedCommits;
}
export function selectMissedUncommittedChanges(synState, sessionHash, latestSeenSessionIndex) {
    const sessionWorkspace = synState.joinedSessions[sessionHash];
    if (sessionWorkspace.uncommittedChanges.atSessionIndex >= latestSeenSessionIndex)
        return sessionWorkspace.uncommittedChanges;
    else {
        // Only return the changes that they haven't seen yet
        const uncommittedChanges = sessionWorkspace.uncommittedChanges;
        const uncommittedDeltaIndex = latestSeenSessionIndex - uncommittedChanges.atSessionIndex;
        return {
            atSessionIndex: latestSeenSessionIndex + 1,
            deltas: uncommittedChanges.deltas.slice(uncommittedDeltaIndex),
            authors: uncommittedChanges.authors, // TODO: optimization of only sending the authors of the missed deltas?
        };
    }
}
export function selectCurrentSessionIndex(sessionWorkspace) {
    return (sessionWorkspace.uncommittedChanges.atSessionIndex +
        sessionWorkspace.uncommittedChanges.deltas.length);
}
export function selectFolksInSession(sessionWorkspace) {
    return Object.entries(sessionWorkspace.folks)
        .filter(([_, info]) => info.inSession)
        .map(([f, _]) => f);
}
//# sourceMappingURL=selectors.js.map