import type { ChangeNotice } from '@holochain-syn/client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { applyChanges, change, getChanges } from 'automerge';
import { isEqual } from 'lodash-es';

import { amIScribe, selectSessionState } from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import type { GrammarDelta, SynGrammar } from '../../../grammar';

export function folkRequestChange<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  deltas: Array<GrammarDelta<G>>
) {
  if (deltas.length === 0) return;

  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);
    let newState = sessionState.state;
    let newEphemeralState = sessionState.ephemeral;
    for (const delta of deltas) {
      newState = change(newState, doc => {
        newEphemeralState = change(newEphemeralState, eph => {
          workspace.grammar.applyDelta(doc, delta, eph, workspace.myPubKey);
        });
      });
    }
    const stateChanges = getChanges(sessionState.state, newState);
    const ephemeralChanges = getChanges(
      sessionState.ephemeral,
      newEphemeralState
    );

    sessionState.state = newState;
    sessionState.ephemeral = newEphemeralState;
    sessionState.unpublishedChanges = [
      ...sessionState.unpublishedChanges,
      ...stateChanges,
    ];
    sessionState.unpublishedEphemeralChanges = [
      ...sessionState.unpublishedEphemeralChanges,
      ...ephemeralChanges,
    ];

    workspace.client.sendChangeRequest({
      sessionHash,
      scribe: state.sessions[sessionHash].scribe,
      stateChanges,
      ephemeralChanges,
    });
    /* 
    const newRequestedChanges: RequestedChange[] = [];

    const atDate = Date.now();

    for (let i = 0; i < deltas.length; i++) {
      newRequestedChanges.push({
        lastDeltaSeen,
        atDate,
        atFolkIndex: sessionState.myFolkIndex + i,
        delta: deltas[i],
      });
    }

    sessionState.nonRequestedChanges = [
      ...sessionState.nonRequestedChanges,
      ...newRequestedChanges,
    ];

    if (!sessionState.nonRequestedChangesAtLastDeltaSeen) {
      sessionState.nonRequestedChangesAtLastDeltaSeen = lastDeltaSeen;
    }
    if (sessionState.nonRequestedChangesAtFolkIndex == undefined) {
      sessionState.nonRequestedChangesAtFolkIndex = sessionState.myFolkIndex;
    }

    sessionState.myFolkIndex += deltas.length;
 */
    return state;
  });
}

export async function requestChanges<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64
) {
  workspace.store.update(state => {
    if (amIScribe(state, sessionHash)) return state;

    const sessionState = selectSessionState(state, sessionHash);

    if (
      sessionState.unpublishedChanges.length > 0 ||
      sessionState.unpublishedChanges.length > 0
    ) {
      workspace.client.sendChangeRequest({
        stateChanges: sessionState.unpublishedChanges,
        ephemeralChanges: sessionState.unpublishedEphemeralChanges,
        scribe: state.sessions[sessionHash].scribe,
        sessionHash,
      });
    }
    return state;
  });
}

export async function checkRequestedChanges<G extends SynGrammar<any, any>>(
  _workspace: SynWorkspace<G>,
  _sessionHash: EntryHashB64
) {
  /* 
  let state = get(workspace.store);
  if (amIScribe(state, sessionHash)) {
    return;
  }

  let session = selectSessionState(state, sessionHash);

  if (
    session.requestedChanges.length > 0 &&
    Date.now() - session.requestedChanges[0].atDate >
      workspace.config.requestTimeout
  ) {
    // send a sync request incase something just got out of sequence
    // TODO: prepare for shifting to new scribe if they went offline

    await joinSession(workspace, sessionHash);

    state = get(workspace.store);
    session = selectSessionState(state, sessionHash);

    await workspace.client.sendSyncRequest({
      lastDeltaSeen: selectLastDeltaSeen(session),
      scribe: state.sessions[sessionHash].scribe,
      sessionHash,
    });
  } */
}

// Folk
export function handleChangeNotice<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  changeNotice: ChangeNotice
) {
  workspace.store.update(state => {
    if (amIScribe(state, sessionHash)) {
      console.warn(
        `Received a change notice but I'm the scribe for this session, ignoring`
      );
      return state;
    }

    const sessionState = selectSessionState(state, sessionHash);
    const changes = applyChanges(sessionState.state, changeNotice.stateChanges);
    const ephemeralChanges = applyChanges(
      sessionState.ephemeral,
      changeNotice.ephemeralChanges
    );
    sessionState.state = changes[0];
    sessionState.ephemeral = ephemeralChanges[0];

    if (
      changes[1].pendingChanges > 0 ||
      ephemeralChanges[1].pendingChanges > 0
    ) {
      // One of the changes that the scribe had broadcasted has been lost
      // Initiate sync request
    }

    sessionState.unpublishedChanges = sessionState.unpublishedChanges.filter(
      change => !changeNotice.stateChanges.find(d => isEqual(d, change))
    );
    sessionState.unpublishedEphemeralChanges =
      sessionState.unpublishedEphemeralChanges.filter(
        change => !changeNotice.ephemeralChanges.find(d => isEqual(d, change))
      );

    return state;
  });
}
