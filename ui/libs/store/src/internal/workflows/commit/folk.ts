import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { CommitNotice } from '@holochain-syn/client';
import type { SynGrammar } from '../../../grammar';
import { amIScribe } from '../../../state/selectors';

import type { SynWorkspace } from '../../workspace';

export async function handleCommitNotice<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  _commitNotice: CommitNotice
) {
  // TODO: move this away from here
  /*   const initialSnapshotHash = await workspace.client.hashSnapshot(
    workspace.grammar.initialState
  ); */
  workspace.store.update(state => {
    if (amIScribe(state, sessionHash)) {
      console.log("Received a commit notice but I'm the scribe!");
      return state;
    }

    /* 
    const latestCommittedContentHash = selectLatestSnapshotHash(
      state,
      sessionHash,
      initialSnapshotHash
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

      if (sessionState.prerequestContent) {
        sessionState.prerequestContent.lastDeltaSeen = {
          commitHash: commitNotice.commitHash,
          deltaIndexInCommit: 0,
        };
      }
    } else {
      workspace.client.sendSyncRequest({
        lastDeltaSeen: selectLastDeltaSeen(sessionState),
        scribe: state.sessions[sessionHash].scribe,
        sessionHash,
      });
    } */

    return state;
  });
}
