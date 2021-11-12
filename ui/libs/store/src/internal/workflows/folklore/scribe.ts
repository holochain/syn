import type {
  EntryHashB64,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';

import {
  selectSessionState,
  selectFolksInSession,
  amIScribe,
} from '../../../state/selectors';
import type { SessionState } from '../../../state/syn-state';
import type { SynWorkspace } from '../../workspace';

export function notifyFolkLore<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
) {
  workspace.store.update(state => {
    const session = selectSessionState(state, sessionHash) as SessionState;

    workspace.client.sendFolkLore({
      folkLore: session.folks,
      participants: selectFolksInSession(workspace, session),
      sessionHash,
    });
    return state;
  });
}

export function handleHeartbeat<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  fromFolk: AgentPubKeyB64
) {
  workspace.store.update(state => {
    if (!amIScribe(state, sessionHash)) {
      console.log("Received a heartbeat from a folk but I'm not the scribe");
      return state;
    }

    const session = selectSessionState(state, sessionHash) as SessionState;

    session.folks[fromFolk] = {
      lastSeen: Date.now(),
    };

    return state;
  });
}
