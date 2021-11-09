import type { EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SynWorkspace } from '../../workspace';

// Pick and join a session
export async function joinSession<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
): Promise<void> {
  const session = await workspace.client.getSession(sessionHash);

  return new Promise(resolve => {
    workspace.store.update(state => {
      state.sessions[sessionHash] = session;

      state.joiningSessions[sessionHash] = resolve;

      if (session.scribe !== state.myPubKey) {
        workspace.client.sendSyncRequest({
          scribe: session.scribe,
          sessionHash: sessionHash,
          lastDeltaSeen: undefined,
        });
      }

      state.activeSessionHash = sessionHash;

      return state;
    });
  });
}
