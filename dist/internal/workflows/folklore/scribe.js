import { selectSessionWorkspace, selectFolksInSession, amIScribe, } from "../../../state/selectors";
import { putJustSeenFolks } from "./utils";
export function notifyGoneFolks(workspace, sessionHash) {
    workspace.store.update((state) => {
        const session = selectSessionWorkspace(state, sessionHash);
        const gone = updateGoneFolks(session, workspace.config.outOfSessionTimeout);
        if (gone.length > 0) {
            workspace.client.sendFolkLore({
                data: { gone },
                participants: selectFolksInSession(session),
                sessionHash,
            });
        }
        return state;
    });
}
export function handleHeartbeat(workspace, sessionHash, fromFolk) {
    workspace.store.update((state) => {
        if (!amIScribe(state, sessionHash)) {
            console.log("Received a heartbeat from a folk but I'm not the scribe");
            return state;
        }
        const session = selectSessionWorkspace(state, sessionHash);
        putJustSeenFolks(session, state.myPubKey, [fromFolk]);
        return state;
    });
}
function updateGoneFolks(sessionWorkspace, outOfSessionTimeout) {
    const gone = [];
    const now = Date.now();
    for (const folk of Object.keys(sessionWorkspace.folks)) {
        if (now - sessionWorkspace.folks[folk].lastSeen > outOfSessionTimeout) {
            sessionWorkspace.folks[folk].inSession = false;
            gone.push(folk);
        }
    }
    return gone;
}
//# sourceMappingURL=scribe.js.map