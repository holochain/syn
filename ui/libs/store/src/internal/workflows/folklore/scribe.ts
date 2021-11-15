import type {
  EntryHashB64,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';
import type { SynEngine } from '../../../engine';

import {
  selectSessionState,
  selectFolksInSession,
  amIScribe,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';

export function notifyFolkLore<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64
) {
  workspace.store.update(state => {
    const session = selectSessionState(state, sessionHash);

    workspace.client.sendFolkLore({
      folkLore: session.folks,
      participants: selectFolksInSession(workspace, session),
      sessionHash,
    });
    return state;
  });
}

export function handleHeartbeat<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64,
  fromFolk: AgentPubKeyB64
) {
  workspace.store.update(state => {
    if (!amIScribe(state, sessionHash)) {
      console.log("Received a heartbeat from a folk but I'm not the scribe");
      return state;
    }

    const session = selectSessionState(state, sessionHash);

    session.folks[fromFolk] = {
      lastSeen: Date.now(),
    };

    return state;
  });
}
