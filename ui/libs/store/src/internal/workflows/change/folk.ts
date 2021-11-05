import type { ChangeBundle, Content, FolkChanges } from '@syn/zome-client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import cloneDeep from 'lodash-es/cloneDeep';
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
import { joinSession } from '../sessions/folk';

export function folkRequestChange<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  deltas: DELTA[]
) {
  workspace.store.update(state => {
    const sessionWorkspace = selectSessionWorkspace(state, sessionHash);

    const currentSessionIndex =
      selectCurrentSessionIndex(sessionWorkspace) +
      sessionWorkspace.requestedChanges.length;
console.log('requestedChanges', currentSessionIndex, sessionWorkspace.requestedChanges.length)
    // TODO: don't do this if strategy === CRDT
    if (!sessionWorkspace.prerequestContent) {
      sessionWorkspace.prerequestContent = {
        atSessionIndex: currentSessionIndex,
        content: cloneDeep(sessionWorkspace.currentContent),
      };
    }

    for (const delta of deltas) {
      sessionWorkspace.currentContent = workspace.applyDeltaFn(
        sessionWorkspace.currentContent,
        delta
      );
    }

    const newRequestedChanges: RequestedChange[] = [];

    const atDate = Date.now();

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

    // We don't want to reapply our own made changes
    const myChanges = changes.authors[state.myPubKey];

    let contentToApplyTo = session.currentContent;

    if (
      myChanges &&
      session.prerequestContent &&
      session.prerequestContent.atSessionIndex === changes.atSessionIndex
    ) {
      contentToApplyTo = session.prerequestContent?.content;
    }

    for (const delta of changes.deltas) {
      session.currentContent = workspace.applyDeltaFn(contentToApplyTo, delta);
    }

    session.uncommittedChanges.deltas = [
      ...session.uncommittedChanges.deltas,
      ...changes.deltas,
    ];
    console.log(selectCurrentSessionIndex(session));

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

    if (myChanges) {
      clearRequested(session, myChanges, session.currentContent);
    }

    return state;
  });
}

function clearRequested(
  session: SessionWorkspace,
  myChanges: FolkChanges,
  newContent: Content
) {
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
  } else {
    session.prerequestContent = {
      atSessionIndex: selectCurrentSessionIndex(session),
      content: newContent,
    };
  }
}
