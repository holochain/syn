import type { Commit } from '@syn/zome-client';
import type {
  EntryHashB64,
  HeaderHashB64,
} from '@holochain-open-dev/core-types';

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

  session.uncommittedChanges = {
    authors: {},
    deltas: [],
  };
}
