import { amIScribe, selectCurrentSessionIndex, selectFolksInSession, selectSessionWorkspace, } from "../../../state/selectors";
import { putJustSeenFolks } from "../folklore/utils";
import { commitChanges } from "../commit/scribe";
export function scribeRequestChange(workspace, sessionHash, deltas) {
    workspace.store.update((state) => {
        const session = selectSessionWorkspace(state, sessionHash);
        const changeBundle = putDeltas(workspace.applyDeltaFn, session, state.myPubKey, session.myFolkIndex, deltas);
        workspace.client.sendChange({
            participants: selectFolksInSession(session),
            sessionHash,
            changes: changeBundle,
        });
        triggerCommitIfNecessary(workspace, sessionHash, session.uncommittedChanges.deltas.length);
        session.myFolkIndex += deltas.length;
        return state;
    });
}
export function handleChangeRequest(workspace, sessionHash, changeRequest) {
    workspace.store.update((state) => {
        if (!amIScribe(state, sessionHash)) {
            console.warn(`Received a change request but I'm not the scribe for this session`);
            return state;
        }
        const session = selectSessionWorkspace(state, sessionHash);
        putJustSeenFolks(session, state.myPubKey, [changeRequest.folk]);
        const currentSessionIndex = selectCurrentSessionIndex(session);
        if (currentSessionIndex !== changeRequest.atSessionIndex) {
            console.warn("Scribe is receiving change out of order!");
            console.warn(`nextIndex: ${currentSessionIndex}, changeIndex:${changeRequest.atSessionIndex} for deltas:`, changeRequest.deltas);
            if (changeRequest.atSessionIndex < currentSessionIndex) {
                // change is too late, nextIndex has moved on
                // TODO: rebase? notify sender?
                return state;
            }
            else {
                // change is in the future, possibly some other change was dropped or is slow in arriving
                // TODO: wait a bit?  Ask sender for other changes?
                return state;
            }
        }
        const changeBundle = putDeltas(workspace.applyDeltaFn, session, changeRequest.folk, changeRequest.atFolkIndex, changeRequest.deltas);
        workspace.client.sendChange({
            changes: changeBundle,
            participants: selectFolksInSession(session),
            sessionHash,
        });
        triggerCommitIfNecessary(workspace, sessionHash, session.uncommittedChanges.deltas.length);
        return state;
    });
}
function triggerCommitIfNecessary(workspace, sessionHash, uncommittedChangesCount) {
    if (workspace.config.commitStrategy
        .CommitEveryNDeltas &&
        workspace.config.commitStrategy
            .CommitEveryNDeltas <= uncommittedChangesCount) {
        commitChanges(workspace, sessionHash);
    }
}
function putDeltas(applyDeltaFn, session, author, atFolkIndex, deltas) {
    const previousSessionIndex = selectCurrentSessionIndex(session);
    // Immediately update the contents of the session
    session.uncommittedChanges.deltas = [
        ...session.uncommittedChanges.deltas,
        ...deltas,
    ];
    let currentContent = session.currentContent;
    for (const delta of deltas) {
        currentContent = applyDeltaFn(currentContent, delta);
    }
    session.currentContent = currentContent;
    // Build the change bundle
    const authorChanges = [];
    for (let i = previousSessionIndex; i < previousSessionIndex + deltas.length; i++) {
        authorChanges.push(i);
    }
    const folkChanges = {
        atFolkIndex,
        sessionChanges: authorChanges,
    };
    return {
        atSessionIndex: previousSessionIndex,
        deltas,
        authors: {
            [author]: folkChanges,
        },
    };
}
//# sourceMappingURL=scribe.js.map