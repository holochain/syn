import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import { get } from "svelte/store";

import { amIScribe } from "../../../state/selectors";
import type { SynWorkspace } from "../../workspace";
import { folkRequestChange } from "./folk";
import { scribeRequestChange } from "./scribe";

// Folk or scribe
export function requestChange<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  deltas: DELTA[]
): void {
  const state = get(workspace.store);

  if (amIScribe(state, sessionHash))
    return scribeRequestChange(workspace, sessionHash, deltas);
  else return folkRequestChange(workspace, sessionHash, deltas);
}
