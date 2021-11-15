import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { FolkLore } from '@syn/zome-client';
import type { SynEngine } from '../../../engine';

import {
  amIScribe,
  selectSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';

export function handleFolkLore<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64,
  folklore: FolkLore
) {
  workspace.store.update(state => {
    if (amIScribe(state, sessionHash)) {
      console.log("Received folklore but I'm the scribe, ignoring");
      return state;
    }

    const session = selectSession(state, sessionHash);
    const sessionState = selectSessionState(state, sessionHash);

    sessionState.folks = {
      ...folklore,
      [session.scribe]: {
        lastSeen: Date.now(),
      },
    };

    return state;
  });
}
