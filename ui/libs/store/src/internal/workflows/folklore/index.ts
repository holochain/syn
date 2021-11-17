import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import { get } from "svelte/store";
import type { SynGrammar } from "../../../grammar";

import { amIScribe, selectScribe } from "../../../state/selectors";
import type { SynWorkspace } from "../../workspace";

import { notifyFolkLore } from "./scribe";

export function heartbeat<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64
) {
  const state = get(workspace.store);

  if (amIScribe(state, sessionHash))
    return notifyFolkLore(workspace, sessionHash);
  else {
    // I'm not the scribe so send them a heartbeat
    return workspace.client.sendHeartbeat({
      scribe: selectScribe(state, sessionHash),
      data: "hi",
      sessionHash: sessionHash,
    });
  }
}
