// Pick and join a session
export async function newSession(workspace, fromSnapshot) {
    let currentContent = workspace.initialContent;
    if (fromSnapshot) {
        currentContent = await workspace.client.getSnapshot(fromSnapshot);
    }
    else {
        fromSnapshot = await workspace.client.putSnapshot(workspace.initialContent);
    }
    const session = await workspace.client.newSession({
        snapshotHash: fromSnapshot,
    });
    workspace.store.update(state => {
        state.sessions[session.sessionHash] = session.session;
        state.joinedSessions[session.sessionHash] = {
            sessionHash: session.sessionHash,
            commitHashes: [],
            currentContent,
            myFolkIndex: 0,
            prerequestContent: undefined,
            requestedChanges: [],
            uncommittedChanges: {
                atSessionIndex: 0,
                authors: {},
                deltas: [],
            },
            folks: {},
        };
        state.activeSessionHash = session.sessionHash;
        return state;
    });
    return session.sessionHash;
}
//# sourceMappingURL=scribe.js.map