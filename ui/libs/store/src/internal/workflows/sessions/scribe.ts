import type { EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SynWorkspace } from '../../workspace';

// Pick and join a session
export async function newSession<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  fromCommit?: EntryHashB64
): Promise<EntryHashB64> {
  let currentContent = workspace.initialSnapshot;

  if (fromCommit) {
    let currentCommit = await workspace.client.getCommit(fromCommit);

    currentContent = await workspace.client.getSnapshot(
      currentCommit.newContentHash
    );
  } else {
    await workspace.client.putSnapshot(workspace.initialSnapshot);
  }
  const session = await workspace.client.newSession({
    initialCommitHash: fromCommit,
  });

  workspace.store.update(state => {
    state.sessions[session.sessionHash] = session.session;

    state.joinedSessions[session.sessionHash] = {
      currentCommitHash: fromCommit,
      sessionHash: session.sessionHash,
      currentContent,
      myFolkIndex: 0,
      ephemeral: {},
      prerequestContent: undefined,
      requestedChanges: [],
      uncommittedChanges: {
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
