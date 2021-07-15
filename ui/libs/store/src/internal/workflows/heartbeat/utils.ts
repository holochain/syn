import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

import type { SessionWorkspace } from "../../../state/syn-state";

export function putJustSeenFolks(
  session: SessionWorkspace,
  myPubKey: AgentPubKeyB64,
  folks: AgentPubKeyB64[]
) {
  const now = Date.now();

  for (const folk of folks) {
    if (folk !== myPubKey) {
      session.folks[folk] = {
        lastSeen: now,
        inSession: true,
      };
    }
  }
}
