import { amIScribe, selectFolksInSession, selectMissedCommits, selectMissedUncommittedChanges, selectSessionWorkspace, } from "../../../state/selectors";
import { putJustSeenFolks } from "../folklore/utils";
/**
 * Scribe is managing the session, a folk comes in:
 *
 * - Folk: `SyncRequest`
 *     "Hey scribe! So I think I'm out of date and I don't know all the latest changes.
 *      This is the latest changes I've seen... Help me please?"
 * - Scribe: `SyncResponse`
 *     "Oh sure! Here is the commits you missed since you were gone, and here are the
 *      uncommitted changes on top of them. From now on I'll update you whenever a change happens."
 *
 */
export function handleSyncRequest(workspace, sessionHash, requestSyncInput) {
    workspace.store.update((synState) => {
        if (!amIScribe(synState, sessionHash)) {
            console.log("syncReq received but I'm not the scribe!");
            return synState;
        }
        const session = selectSessionWorkspace(synState, sessionHash);
        putJustSeenFolks(session, synState.myPubKey, [requestSyncInput.folk]);
        const missedCommits = selectMissedCommits(synState, sessionHash, requestSyncInput.lastSessionIndexSeen);
        const uncommittedChanges = selectMissedUncommittedChanges(synState, sessionHash, requestSyncInput.lastSessionIndexSeen);
        const syncState = {
            uncommittedChanges,
            missedCommits,
            //currentContentHash:
        };
        workspace.client.sendSyncResponse({
            participant: requestSyncInput.folk,
            state: syncState,
            sessionHash,
        });
        const participants = selectFolksInSession(session);
        workspace.client.sendFolkLore({
            participants,
            sessionHash,
            data: { participants: [...participants, synState.myPubKey] },
        });
        return synState;
    });
}
//# sourceMappingURL=scribe.js.map