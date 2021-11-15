import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { CommitNotice } from '@syn/zome-client';
import type { SynEngine } from '../../../engine';
import {
  amIScribe,
  selectLastDeltaSeen,
  selectLatestSnapshotHash,
  selectSessionState,
} from '../../../state/selectors';

import type { SynWorkspace } from '../../workspace';
import { buildCommitFromUncommitted, putNewCommit } from './utils';

export async function handleCommitNotice<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64,
  commitNotice: CommitNotice
) {
  // TODO: move this away from here
  const initialSnapshotHash = await workspace.client.hashSnapshot(
    workspace.engine.initialContent
  );
  workspace.store.update(state => {
    if (amIScribe(state, sessionHash)) {
      console.log("Received a commit notice but I'm the scribe!");
      return state;
    }

    const latestCommittedContentHash = selectLatestSnapshotHash(
      state,
      sessionHash
    );
    const sessionState = selectSessionState(state, sessionHash);

    if (
      latestCommittedContentHash === commitNotice.previousContentHash &&
      commitNotice.committedDeltasCount ===
        sessionState.uncommittedChanges.deltas.length
    ) {
      const commit = buildCommitFromUncommitted(
        state,
        sessionHash,
        commitNotice.newContentHash,
        initialSnapshotHash
      );
      putNewCommit(state, sessionHash, commitNotice.commitHash, commit);
    } else {
      workspace.client.sendSyncRequest({
        lastDeltaSeen: selectLastDeltaSeen(sessionState),
        scribe: state.sessions[sessionHash].scribe,
        sessionHash,
      });
    }

    return state;
  });
}
