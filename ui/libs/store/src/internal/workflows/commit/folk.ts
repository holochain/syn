import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import type { CommitNotice } from "@syn/zome-client";
import {
  amIScribe,
  selectLatestCommittedContentHash,
  selectSession,
} from "../../../state/selectors";
import type { SessionWorkspace } from "../../../state/syn-state";

import type { SynWorkspace } from "../../workspace";
import { buildCommitFromUncommitted, putNewCommit } from "./utils";

export function handleCommitNotice<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  commitNotice: CommitNotice
) {
  workspace.store.update((state) => {
    if (amIScribe(state, sessionHash)) {
      console.log("Received a commit notice but I'm the scribe!");
      return state;
    }

    const latestCommittedContentHash = selectLatestCommittedContentHash(
      state,
      sessionHash
    );
    const session = selectSession(state, sessionHash) as SessionWorkspace;

    if (
      latestCommittedContentHash === commitNotice.previousContentHash &&
      commitNotice.committedDeltasCount ===
        session.uncommittedChanges.deltas.length
    ) {
      const commit = buildCommitFromUncommitted(
        state,
        sessionHash,
        commitNotice.newContentHash
      );
      putNewCommit(state, sessionHash, commitNotice.commitHash, commit);
    } else {
      // TODO: resync
    }

    return state;
  });
}
