import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { FolkLore } from '@holochain-syn/client';
import type { SynGrammar } from '../../../grammar';

import {
  amIScribe,
  selectSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';

export function handleFolkLore<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
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
