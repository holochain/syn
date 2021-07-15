import type { SessionInfo } from "@syn/zome-client";
import type { EntryHashB64 } from "@holochain-open-dev/core-types";

import { applyCommits, orderCommits } from "../utils";
import type { SynWorkspace } from "../workspace";

// Pick and join a session
export async function joinSession<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
): Promise<void> {
  const session = await workspace.client.getSession(sessionHash);
  const orderedCommitHashes = orderCommits(
    session.session.snapshotHash,
    session.commits
  );

  const orderedCommits = orderedCommitHashes.map(
    (hash) => session.commits[hash]
  );

  const currentContent = applyCommits(
    session.snapshot,
    workspace.applyDeltaFn,
    orderedCommits
  );

  workspace.store.update((state) => {
    state.joinedSessions[session.sessionHash] = {
      sessionHash: session.sessionHash,
      session: session.session,
      commitHashes: orderedCommitHashes,
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

    if (session.session.scribe !== state.myPubKey) {
      workspace.client.sendSyncRequest({
        scribe: session.session.scribe,
        sessionHash: session.sessionHash,
        lastSessionIndexSeen: 0,
      });
    }

    return state;
  });
}

// For now, very simple logic: get all the sessions, and join the first one
// If there are no sessions, create a new one
export async function getSessionToJoin<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>
): Promise<SessionInfo> {
  const sessions = await workspace.client.getSessions();
  if (sessions.length === 0) {
    const snapshotHash = await workspace.client.putSnapshot(
      workspace.initialContent
    );
    return workspace.client.newSession({
      snapshotHash,
    });
  } else {
    return workspace.client.getSession(sessions[0]);
  }
}
