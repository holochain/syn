import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { FolkLore } from '@syn/zome-client';

import {
  amIScribe,
  selectSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SessionState } from '../../../state/syn-state';
import type { SynWorkspace } from '../../workspace';

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

    const session = selectSession(state, sessionHash);
    const sessionState = selectSessionState(state, sessionHash) as SessionState;
    sessionState.folks = {
      ...folklore,
      [session.scribe]: {
        lastSeen: Date.now(),
      },
    };

    return state;
  });
}
