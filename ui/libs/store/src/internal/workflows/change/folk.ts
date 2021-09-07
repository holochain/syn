import type { ChangeBundle, FolkChanges } from '@syn/zome-client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { cloneDeep } from 'lodash-es';
import { get } from 'svelte/store';

import {
  amIScribe,
  selectCurrentSessionIndex,
  selectSessionWorkspace,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import type {
  RequestedChange,
  SessionWorkspace,
} from '../../../state/syn-state';
import { applyChangeBundle } from '../../utils';
import { joinSession } from '../sessions/folk';

export function folkRequestChange<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  deltas: DELTA[]
) {
  workspace.store.update(state => {
    const sessionWorkspace = selectSessionWorkspace(state, sessionHash);

    // TODO: don't do this if strategy === CRDT
    sessionWorkspace.prerequestContent = cloneDeep(
      sessionWorkspace.currentContent
    );

    for (const delta of deltas) {
      sessionWorkspace.currentContent = workspace.applyDeltaFn(
        sessionWorkspace.currentContent,
        delta
      );
    }

    const newRequestedChanges: RequestedChange[] = [];

    const atDate = Date.now();
    console.log(sessionWorkspace.uncommittedChanges);
    const currentSessionIndex = selectCurrentSessionIndex(sessionWorkspace);
    for (let i = 0; i < deltas.length; i++) {
      newRequestedChanges.push({
        atDate,
        atFolkIndex: sessionWorkspace.myFolkIndex + i,
        atSessionIndex: currentSessionIndex + i,
        delta: deltas[i],
      });
    }

    sessionWorkspace.requestedChanges = [
      ...sessionWorkspace.requestedChanges,
      ...newRequestedChanges,
    ];

    workspace.client.sendChangeRequest({
      atFolkIndex: sessionWorkspace.myFolkIndex,
      atSessionIndex: currentSessionIndex,
      deltas,
      scribe: state.sessions[sessionHash].scribe,
      sessionHash,
    });

    sessionWorkspace.myFolkIndex += deltas.length;

    return state;
  });
}

export async function checkRequestedChanges<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
) {
  let state = get(workspace.store);
  if (amIScribe(state, sessionHash)) {
    return;
  }

  let session = selectSessionWorkspace(state, sessionHash) as SessionWorkspace;

  console.log(session.requestedChanges);
  if (
    session.requestedChanges.length > 0 &&
    Date.now() - session.requestedChanges[0].atDate >
      workspace.config.requestTimeout
  ) {
    // send a sync request incase something just got out of sequence
    // TODO: prepare for shifting to new scribe if they went offline

    await joinSession(workspace, sessionHash);

    state = get(workspace.store);
    session = selectSessionWorkspace(state, sessionHash) as SessionWorkspace;
    await workspace.client.sendSyncRequest({
      lastSessionIndexSeen: selectCurrentSessionIndex(session),
      scribe: state.sessions[sessionHash].scribe,
      sessionHash,
    });
  }
}

// Folk
export function handleChangeNotice<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  changes: ChangeBundle
) {
  workspace.store.update(state => {
    if (amIScribe(state, sessionHash)) {
      console.warn(
        `Received a change notice but I'm the scribe for this session, ignoring`
      );
      return state;
    }

    const session = selectSessionWorkspace(
      state,
      sessionHash
    ) as SessionWorkspace;

    // TODO
    // If CRDT, we don't care about requested changes
    // If BlockOnConflict, we try to rebase and block if applyDelta returns conflict

    session.currentContent = applyChangeBundle(
      session.currentContent,
      workspace.applyDeltaFn,
      changes
    );
    session.uncommittedChanges.deltas = [
      ...session.uncommittedChanges.deltas,
      changes.deltas,
    ];

    for (const [author, newFolkChanges] of Object.entries(
      session.uncommittedChanges.authors
    )) {
      if (!session.uncommittedChanges.authors[author]) {
        session.uncommittedChanges.authors[author] = newFolkChanges;
      } else {
        const folkChanges = session.uncommittedChanges.authors[author];
        if (
          folkChanges.atFolkIndex + folkChanges.sessionChanges.length !==
          newFolkChanges.atFolkIndex
        ) {
          // We missed changes from this folk?
        }
        folkChanges.sessionChanges = [
          ...folkChanges.sessionChanges,
          ...newFolkChanges.sessionChanges,
        ];
      }
    }

    const myChanges = changes.authors[state.myPubKey];
    if (myChanges) {
      clearRequested(session, myChanges);
    }

    return state;
  });
}

function clearRequested(session: SessionWorkspace, myChanges: FolkChanges) {
  const leftRequestedChanges: RequestedChange[] = [];

  for (const requestedChange of session.requestedChanges) {
    if (
      !(
        requestedChange.atFolkIndex >= myChanges.atFolkIndex &&
        requestedChange.atFolkIndex <
          myChanges.atFolkIndex + myChanges.sessionChanges.length
      )
    ) {
      leftRequestedChanges.push(requestedChange);
    }
  }
  session.requestedChanges = leftRequestedChanges;

  if (session.requestedChanges.length === 0) {
    session.prerequestContent = undefined;
  }
}
