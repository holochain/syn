import type { Commit } from '@syn/zome-client';
import type {
  EntryHashB64,
  HeaderHashB64,
} from '@holochain-open-dev/core-types';
import cloneDeep from 'lodash-es/cloneDeep';

import type { SynState } from '../../../state/syn-state';
import {
  selectLatestSnapshotHash,
  selectSessionState,
} from '../../../state/selectors';
import type { SynGrammar } from '../../../grammar';

export function buildCommitFromUncommitted<G extends SynGrammar<any, any>>(
  state: SynState<G>,
  sessionHash: EntryHashB64,
  newContentHash: EntryHashB64,
  initialSnapshotHash: EntryHashB64
): Commit {
  const session = selectSessionState(state, sessionHash);

  const lastCommitHash = session.lastCommitHash;
  return {
    changes: session.uncommittedChanges,
    previousCommitHashes: lastCommitHash ? [lastCommitHash] : [],
    previousContentHash:
      selectLatestSnapshotHash(state, sessionHash) || initialSnapshotHash,
    newContentHash,
    createdAt: Date.now(),
    meta: {
      appSpecific: null,
      witnesses: [],
    },
  };
}

export function putNewCommit<G extends SynGrammar<any, any>>(
  state: SynState<G>,
  sessionHash: EntryHashB64,
  newCommitHash: HeaderHashB64,
  commit: Commit
) {
  state.commits[newCommitHash] = commit;
  const session = selectSessionState(state, sessionHash);

  session.lastCommitHash = newCommitHash;
  state.snapshots[commit.newContentHash] = cloneDeep(session.currentContent);

  session.uncommittedChanges = {
    authors: {},
    deltas: [],
  };
}
