import type { ChangeRequest } from '@holochain-syn/client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';

import {
  amIScribe,
  selectFolksInSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import { commitChanges, commitLock } from '../commit/scribe';
import type { GrammarDelta, GrammarState, SynGrammar } from '../../../grammar';
import {
  applyChanges,
  change,
  FreezeObject,
  getChanges,
  load,
  clone,
} from 'automerge';

export async function scribeRequestChange<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  deltas: Array<GrammarDelta<G>>
) {
  await commitLock;

  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);

    const oldContent = clone(sessionState.state);
    const oldEphemeral = clone(sessionState.ephemeral);

    for (const delta of deltas) {
      sessionState.state = change(sessionState.state, doc => {
        sessionState.ephemeral = change(sessionState.ephemeral, eph => {
          workspace.grammar.applyDelta(doc, delta, eph, workspace.myPubKey);
        });
      });
    }

    const stateChanges = getChanges(oldContent, sessionState.state);
    const ephemeralChanges = getChanges(oldEphemeral, sessionState.ephemeral);

    workspace.client.sendChange({
      stateChanges,
      ephemeralChanges,
      participants: selectFolksInSession(workspace, sessionState),
      sessionHash,
    });

    let lastCommitState: FreezeObject<GrammarState<G>> =
      sessionState.initialSnapshot;
    if (sessionState.lastCommitHash) {
      const commit = state.commits[sessionState.lastCommitHash];

      lastCommitState = load(state.snapshots[commit.newContentHash]);
    }

    const commitChanges = getChanges(lastCommitState, sessionState.state);

    triggerCommitIfNecessary(workspace, sessionHash, commitChanges.length);

    return state;
  });
}

export async function handleChangeRequest<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  changeRequest: ChangeRequest
) {
  await commitLock;

  workspace.store.update(state => {
    if (!amIScribe(state, sessionHash)) {
      console.warn(
        `Received a change request but I'm not the scribe for this session`
      );
      return state;
    }

    const sessionState = selectSessionState(state, sessionHash);

    sessionState.folks[changeRequest.folk] = {
      lastSeen: Date.now(),
    };

    const stateChanges = applyChanges(
      sessionState.state,
      changeRequest.stateChanges
    );
    sessionState.state = stateChanges[0];
    const ephemeralChanges = applyChanges(
      sessionState.ephemeral,
      changeRequest.ephemeralChanges
    );
    sessionState.ephemeral = ephemeralChanges[0];

    if (
      stateChanges[1].pendingChanges > 0 ||
      ephemeralChanges[1].pendingChanges > 0
    ) {
      // One of the changes that this peer sent has been lost
      // Initiate sync request
    }

    workspace.client.sendChange({
      stateChanges: changeRequest.stateChanges,
      ephemeralChanges: changeRequest.ephemeralChanges,
      participants: selectFolksInSession(workspace, sessionState),
      sessionHash,
    });

    let lastCommitState: FreezeObject<GrammarState<G>> =
      sessionState.initialSnapshot;
    if (sessionState.lastCommitHash) {
      const commit = state.commits[sessionState.lastCommitHash];

      lastCommitState = load(state.snapshots[commit.newContentHash]);
    }

    const changesSinceCommit = getChanges(
      lastCommitState,
      sessionState.state
    );

    triggerCommitIfNecessary(workspace, sessionHash, changesSinceCommit.length);

    return state;
  });
}

function triggerCommitIfNecessary<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  uncommittedChangesCount: number
) {
  if (
    (workspace.config.commitStrategy as { CommitEveryNDeltas: number })
      .CommitEveryNDeltas &&
    (workspace.config.commitStrategy as { CommitEveryNDeltas: number })
      .CommitEveryNDeltas <= uncommittedChangesCount
  ) {
    commitChanges(workspace, sessionHash);
  }
}
