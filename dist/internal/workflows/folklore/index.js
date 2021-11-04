import { get } from "svelte/store";
import { amIScribe, selectScribe } from "../../../state/selectors";
import { notifyGoneFolks } from "./scribe";
export function heartbeat(workspace, sessionHash) {
    const state = get(workspace.store);
    if (amIScribe(state, sessionHash))
        return notifyGoneFolks(workspace, sessionHash);
    else {
        // I'm not the scribe so send them a heartbeat
        return workspace.client.sendHeartbeat({
            scribe: selectScribe(state, sessionHash),
            data: "hi",
            sessionHash: sessionHash,
        });
    }
}
//# sourceMappingURL=index.js.map