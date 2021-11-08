import type {
  EntryHashB64,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';
import type { FolkLore } from '@syn/zome-client';

import { amIScribe, selectSessionState } from '../../../state/selectors';
import type { SessionState } from '../../../state/syn-state';
import type { SynWorkspace } from '../../workspace';
import { putJustSeenFolks } from './utils';

export function handleFolkLore<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  folklore: FolkLore
) {
  workspace.store.update(state => {
    if (amIScribe(state, sessionHash)) {
      console.log("Received folklore but I'm the scribe, ignoring");
      return state;
    }

    const session = selectSessionState(state, sessionHash) as SessionState;
    if ((folklore as { gone: AgentPubKeyB64[] }).gone) {
      putGoneFolks(session, (folklore as { gone: AgentPubKeyB64[] }).gone);
    } else {
      putJustSeenFolks(
        session,
        state.myPubKey,
        (folklore as { participants: AgentPubKeyB64[] }).participants
      );
    }

    return state;
  });
}

function putGoneFolks(session: SessionState, goneFolks: AgentPubKeyB64[]) {
  for (const goneFolk of goneFolks) {
    if (!session.folks[goneFolk]) {
      session.folks[goneFolk] = {
        inSession: false,
        lastSeen: 0, // First time we are seeing this folk
      };
    } else {
      session.folks[goneFolk].inSession = false;
    }
  }
}
