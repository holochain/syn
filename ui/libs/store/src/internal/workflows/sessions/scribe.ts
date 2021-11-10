import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { get } from 'svelte/store';
import type { Commit } from '@syn/zome-client';
import cloneDeep from 'lodash-es/cloneDeep';

import { amIScribe } from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';

// Pick and join a session
export async function newSession<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  fromCommit?: EntryHashB64
): Promise<EntryHashB64> {
  let currentContent = workspace.initialSnapshot;
  let currentCommit: Commit | undefined;

  if (fromCommit) {
    currentCommit = await workspace.client.getCommit(fromCommit);

    currentContent = await workspace.client.getSnapshot(
      (currentCommit as Commit).newContentHash
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
    if (fromCommit && currentCommit) {
      state.snapshots[currentCommit?.newContentHash] =
        cloneDeep(currentContent);
      state.commits[fromCommit] = currentCommit;
    }

    state.activeSessionHash = session.sessionHash;

    return state;
  });

  return session.sessionHash;
}

export async function leaveSession<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
) {
  let state = get(workspace.store);

  if (amIScribe(state, sessionHash)) {
    await closeSession(workspace, sessionHash);
  }

  workspace.store.update(state => {
    (state.joinedSessions[sessionHash] as any) = undefined;
    delete state.joinedSessions[sessionHash];
    return state;
  });
}

async function closeSession<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
) {
  await workspace.client.closeSession({
    sessionHash,
  });
}
