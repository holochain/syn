import type { Commit } from '@syn/zome-client';
import type {
  EntryHashB64,
  HeaderHashB64,
} from '@holochain-open-dev/core-types';
import cloneDeep from 'lodash-es/cloneDeep';

import type { SessionState, SynState } from '../../../state/syn-state';
import {
  selectLatestSnapshotHash,
  selectSessionState,
} from '../../../state/selectors';

export function buildCommitFromUncommitted(
  state: SynState,
  sessionHash: EntryHashB64,
  newContentHash: EntryHashB64,
  initialSnapshotHash: EntryHashB64
): Commit {
  const session = selectSessionState(state, sessionHash) as SessionState;
  const lastCommitHash = session.currentCommitHash;
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

export function putNewCommit(
  state: SynState,
  sessionHash: EntryHashB64,
  newCommitHash: HeaderHashB64,
  commit: Commit
) {
  state.commits[newCommitHash] = commit;
  const session = selectSessionState(state, sessionHash) as SessionState;
  session.currentCommitHash = newCommitHash;
  state.snapshots[commit.newContentHash] = cloneDeep(session.currentContent);

  session.uncommittedChanges = {
    authors: {},
    deltas: [],
  };
}
