import type { ChangeNotice } from '@holochain-syn/client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { applyChanges, change, clone, getChanges } from 'automerge';
import { isEqual } from 'lodash-es';

import { amIScribe, selectSessionState } from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import type { GrammarDelta, SynGrammar } from '../../../grammar';

export function folkRequestChange<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  deltas: Array<GrammarDelta<G>>
) {
  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);
    const oldContent = clone(sessionState.currentContent);

    for (const delta of deltas) {
      sessionState.currentContent = change(sessionState.currentContent, doc =>
        workspace.grammar.applyDelta(doc, delta, workspace.myPubKey)
      );
    }
    const changes = getChanges(oldContent, sessionState.currentContent);

    workspace.client.sendChangeRequest({
      deltas: changes,
      scribe: state.sessions[sessionHash].scribe,
      sessionHash,
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

    workspace.client.sendChangeRequest({
      deltas: sessionState.unpublishedChanges,
      scribe: state.sessions[sessionHash].scribe,
      sessionHash,
    });
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
    console.log(changeNotice.deltas);
    sessionState.currentContent = applyChanges(
      sessionState.currentContent,
      changeNotice.deltas
    )[0];

    sessionState.unpublishedChanges = sessionState.unpublishedChanges.filter(
      change => !changeNotice.deltas.find(d => isEqual(d, change))
    );

    return state;
  });
}
