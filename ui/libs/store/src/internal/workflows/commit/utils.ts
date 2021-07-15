import type { Commit } from "@syn/zome-client";
import type {
  EntryHashB64,
  HeaderHashB64,
} from "@holochain-open-dev/core-types";

import type { SessionWorkspace, SynState } from "../../../state/syn-state";
import {
  selectLatestCommitHash,
  selectLatestCommittedContentHash,
  selectSession,
} from "../../../state/selectors";

export function buildCommitFromUncommitted(
  state: SynState,
  sessionHash: EntryHashB64,
  newContentHash: EntryHashB64
): Commit {
  const session = selectSession(state, sessionHash) as SessionWorkspace;
  return {
    changes: session.uncommittedChanges,
    newContentHash,
    previousCommitHash: selectLatestCommitHash(session),
    previousContentHash: selectLatestCommittedContentHash(state, sessionHash),
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
  const session = selectSession(state, sessionHash) as SessionWorkspace;
  session.commitHashes.push(newCommitHash);

  const newSessionIndex =
    commit.changes.atSessionIndex + commit.changes.deltas.length;

  session.uncommittedChanges = {
    atSessionIndex: newSessionIndex,
    authors: {},
    deltas: [],
  };
}
