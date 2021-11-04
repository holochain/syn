import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { CommitInput } from '@syn/zome-client';
import { get } from 'svelte/store';

import {
  amIScribe,
  selectFolksInSession,
  selectSessionWorkspace,
} from '../../../state/selectors';
import type { SessionWorkspace } from '../../../state/syn-state';
import type { SynWorkspace } from '../../workspace';
import { buildCommitFromUncommitted, putNewCommit } from './utils';

export async function commitChanges<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
) {
  const state = get(workspace.store);
  if (!amIScribe(state, sessionHash)) {
    console.log("Trying to commit the changes but I'm not the scribe!");
    return state;
  }
  let session = selectSessionWorkspace(state, sessionHash) as SessionWorkspace;

  const hash = await workspace.client.hashContent(session.currentContent);

  const commit = buildCommitFromUncommitted(state, sessionHash, hash);
  const commitInput: CommitInput = {
    commit,
    participants: selectFolksInSession(session),
    sessionHash,
    sessionSnapshot: state.sessions[sessionHash].snapshotHash,
  };
  const newCommitHash = await workspace.client.commit(commitInput);

  // TODO: what happens if we have a new change while committing?

  workspace.store.update(state => {
    putNewCommit(state, sessionHash, newCommitHash, commit);
    return state;
  });
}
