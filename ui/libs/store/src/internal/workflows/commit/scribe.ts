import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { CommitInput } from '@syn/zome-client';
import { get } from 'svelte/store';
import type { SynGrammar } from '../../../grammar';

import {
  amIScribe,
  selectFolksInSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import { buildCommitFromUncommitted, putNewCommit } from './utils';

export async function commitChanges<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64
): Promise<EntryHashB64 | undefined> {
  const state = get(workspace.store);

  const session = selectSessionState(state, sessionHash);
  if (!session || session.uncommittedChanges.deltas.length === 0)
    return undefined;

  if (!amIScribe(state, sessionHash)) {
    console.log("Trying to commit the changes but I'm not the scribe!");
    return undefined;
  }

  const stateToPersist = workspace.grammar.persistedState
    ? workspace.grammar.persistedState(session.currentContent)
    : session.currentContent;
  const hash = await workspace.client.putSnapshot(stateToPersist);

  const initialSnapshotHash = await workspace.client.hashSnapshot(
    workspace.grammar.initialState
  );

  const commit = buildCommitFromUncommitted(
    state,
    sessionHash,
    hash,
    initialSnapshotHash
  );

  const commitInput: CommitInput = {
    commit,
    participants: selectFolksInSession(workspace, session),
    sessionHash,
  };
  const newCommitHash = await workspace.client.commitChanges(commitInput);

  // TODO: what happens if we have a new change while committing?

  workspace.store.update(state => {
    putNewCommit(state, sessionHash, newCommitHash, commit);
    return state;
  });

  return newCommitHash;
}
