import type {
  EntryHashB64,
  AgentPubKeyB64,
} from "@holochain-open-dev/core-types";

import {
  selectSession,
  selectFolksInSession,
  amIScribe,
} from "../../../state/selectors";
import type { SessionWorkspace } from "../../../state/syn-state";
import type { SynWorkspace } from "../../workspace";
import { putJustSeenFolks } from "./utils";

export function notifyGoneFolks<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
) {
  workspace.store.update((state) => {
    const session = selectSession(state, sessionHash) as SessionWorkspace;
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

export function handleHeartbeat<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  fromFolk: AgentPubKeyB64
) {
  workspace.store.update((state) => {
    if (!amIScribe(state, sessionHash)) {
      console.log("Received a heartbeat from a folk but I'm not the scribe");
      return state;
    }

    const session = selectSession(state, sessionHash) as SessionWorkspace;
    putJustSeenFolks(session, state.myPubKey, [fromFolk]);

    return state;
  });
}

function updateGoneFolks(
  sessionWorkspace: SessionWorkspace,
  outOfSessionTimeout: number
): AgentPubKeyB64[] {
  const gone: AgentPubKeyB64[] = [];
  const now = Date.now();
  for (const folk of Object.keys(sessionWorkspace.folks)) {
    if (now - sessionWorkspace.folks[folk].lastSeen > outOfSessionTimeout) {
      sessionWorkspace.folks[folk].inSession = false;
      gone.push(folk);
    }
  }

  return gone;
}
