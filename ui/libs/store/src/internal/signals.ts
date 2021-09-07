import { get } from "svelte/store";
import { SynMessageType, SynSignal } from "@syn/zome-client";

import type { SynWorkspace } from "./workspace";
import { handleSyncRequest } from "./workflows/sync/scribe";
import { handleSyncResponse } from "./workflows/sync/folk";
import { selectSessionWorkspace } from "../state/selectors";
import { handleChangeRequest } from "./workflows/change/scribe";
import { handleCommitNotice } from "./workflows/commit/folk";
import { handleFolkLore } from "./workflows/folklore/folk";
import { handleHeartbeat } from "./workflows/folklore/scribe";
import { handleChangeNotice } from "./workflows/change/folk";

export function handleSignal<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  signal: SynSignal
) {
  const currentState = get(workspace.store);
  if (!selectSessionWorkspace(currentState, signal.sessionHash)) {
    console.warn(`We are getting a signal for a sesion we don't know about`);
    return;
  }

  switch (signal.message.type) {
    case SynMessageType.SyncReq:
      return handleSyncRequest(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.SyncResp:
      return handleSyncResponse(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.ChangeReq:
      return handleChangeRequest(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.ChangeNotice:
      return handleChangeNotice(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.CommitNotice:
      return handleCommitNotice(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.FolkLore:
      return handleFolkLore(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.Heartbeat:
      return handleHeartbeat(
        workspace,
        signal.sessionHash,
        signal.message.payload.fromFolk
      );
  }
}
