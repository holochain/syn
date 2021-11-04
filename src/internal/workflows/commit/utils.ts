import type { Commit } from "@syn/zome-client";
import type {
  EntryHashB64,
  HeaderHashB64,
} from "@holochain-open-dev/core-types";

import type { SessionWorkspace, SynState } from "../../../state/syn-state";
import {
  selectLatestCommitHash,
  selectLatestCommittedContentHash,
  selectSessionWorkspace,
} from "../../../state/selectors";

export function buildCommitFromUncommitted(
  state: SynState,
  sessionHash: EntryHashB64,
  newContentHash: EntryHashB64
): Commit {
  const session = selectSessionWorkspace(state, sessionHash) as SessionWorkspace;
  const lastCommitHash = selectLatestCommitHash(session);
  return {
    changes: session.uncommittedChanges,
    newContentHash,
    previousCommitHashes: lastCommitHash ? [lastCommitHash] : [],
    previousContentHash: selectLatestCommittedContentHash(state, sessionHash),
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
  const session = selectSessionWorkspace(state, sessionHash) as SessionWorkspace;
  session.commitHashes.push(newCommitHash);

  const newSessionIndex =
    commit.changes.atSessionIndex + commit.changes.deltas.length;

  session.uncommittedChanges = {
    atSessionIndex: newSessionIndex,
    authors: {},
    deltas: [],
  };
}
