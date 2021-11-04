import { get } from "svelte/store";
import { amIScribe } from "../../../state/selectors";
import { folkRequestChange } from "./folk";
import { scribeRequestChange } from "./scribe";
// Folk or scribe
export function requestChange(workspace, sessionHash, deltas) {
    const state = get(workspace.store);
    if (amIScribe(state, sessionHash))
        return scribeRequestChange(workspace, sessionHash, deltas);
    else
        return folkRequestChange(workspace, sessionHash, deltas);
}
//# sourceMappingURL=index.js.map