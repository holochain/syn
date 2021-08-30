import type { EntryHashB64 } from "@holochain-open-dev/core-types";

import type { SynWorkspace } from "../../workspace";

// Pick and join a session
export async function newSession<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  fromSnapshot?: EntryHashB64
): Promise<EntryHashB64> {
  let currentContent = workspace.initialContent;
  if (fromSnapshot) {
    currentContent = await workspace.client.getSnapshot(fromSnapshot);
  } else {
    fromSnapshot = await workspace.client.putSnapshot(workspace.initialContent);
  }
  const session = await workspace.client.newSession({
    snapshotHash: fromSnapshot,
  });

  workspace.store.update((state) => {
    state.joinedSessions[session.sessionHash] = {
      sessionHash: session.sessionHash,
      session: session.session,
      commitHashes: [],
      currentContent,
      myFolkIndex: 0,
      prerequestContent: undefined,
      requestedChanges: [],
      uncommittedChanges: {
        atSessionIndex: 0,
        authors: {},
        deltas: [],
      },
      folks: {},
    };

    state.activeSessionHash = session.sessionHash;

    return state;
  });

  return session.sessionHash;
}
