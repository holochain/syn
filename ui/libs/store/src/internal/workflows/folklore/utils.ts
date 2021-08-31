import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';

import type { SessionWorkspace } from '../../../state/syn-state';
import { getFolkColors } from '../../../utils/colors';

export function putJustSeenFolks(
  session: SessionWorkspace,
  myPubKey: AgentPubKeyB64,
  folks: AgentPubKeyB64[]
) {
  const now = Date.now();

  for (const folk of folks) {
    if (folk !== myPubKey) {
      if (!session.folks[folk]) {
        // First time we are seeing this folk
        const colors = getFolkColors(folk);
        session.folks[folk] = {
          lastSeen: now,
          inSession: true,
          colors,
        };
      } else {
        session.folks[folk].lastSeen = now;
        session.folks[folk].inSession = true;
      }
    }
  }
}
