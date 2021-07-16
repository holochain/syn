import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import { get } from "svelte/store";

import { amIScribe, selectScribe } from "../../../state/selectors";
import type { SynWorkspace } from "../../workspace";

import { notifyGoneFolks } from "./scribe";

export function heartbeat<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
) {
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
