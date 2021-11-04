export function initialState(myPubKey) {
    const internalStore = {
        myPubKey,
        activeSessionHash: undefined,
        sessions: {},
        joinedSessions: {},
        commits: {},
        snapshots: {},
    };
    return internalStore;
}
//# sourceMappingURL=syn-state.js.map