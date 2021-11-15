import type { ChangeNotice, FolkChanges } from '@syn/zome-client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import cloneDeep from 'lodash-es/cloneDeep';
import { get } from 'svelte/store';

import {
  amIScribe,
  selectLastDeltaSeen,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import type { RequestedChange, SessionState } from '../../../state/syn-state';
import { joinSession } from '../sessions/folk';
import type {
  EngineContent,
  EngineDelta,
  EngineEphemeralChanges,
  EngineEphemeralState,
  SynEngine,
} from '../../../engine';

export function folkRequestChange<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64,
  deltas: Array<EngineDelta<E>>,
  ephemeralChanges: EngineEphemeralChanges<E> | undefined
) {
  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);

    const lastDeltaSeen = selectLastDeltaSeen(sessionState);

    // TODO: don't do this if strategy === CRDT
    if (!sessionState.prerequestContent) {
      sessionState.prerequestContent = {
        lastDeltaSeen,
        content: cloneDeep(sessionState.currentContent),
        ephemeral: cloneDeep(sessionState.ephemeral),
      };
    }

    for (const delta of deltas) {
      sessionState.currentContent = workspace.engine.applyDelta(
        sessionState.currentContent,
        delta
      );
    }

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

    sessionState.requestedChanges = [
      ...sessionState.requestedChanges,
      ...newRequestedChanges,
    ];
    sessionState.ephemeral = workspace.engine.ephemeral?.applyEphemeral(
      sessionState.ephemeral,
      ephemeralChanges
    );

    workspace.client.sendChangeRequest({
      lastDeltaSeen,
      ephemeralChanges,
      deltaChanges: {
        atFolkIndex: sessionState.myFolkIndex,
        deltas,
      },
      scribe: state.sessions[sessionHash].scribe,
      sessionHash,
    });

    sessionState.myFolkIndex += deltas.length;

    return state;
  });
}

export async function checkRequestedChanges<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64
) {
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
  }
}

// Folk
export function handleChangeNotice<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
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

    if (changeNotice.ephemeralChanges) {
      sessionState.ephemeral = workspace.engine.ephemeral?.applyEphemeral(
        sessionState.ephemeral,
        changeNotice.ephemeralChanges
      );
    }

    if (!changeNotice.deltaChanges) return state;

    const changes = changeNotice.deltaChanges;

    // TODO
    // If CRDT, we don't care about requested changes
    // If BlockOnConflict, we try to rebase and block if applyDelta returns conflict

    // We don't want to reapply our own made changes
    const myChanges = changes.authors[state.myPubKey];

    let contentToApplyTo = sessionState.currentContent;
    let ephemeralToApplyTo = sessionState.ephemeral;

    const isLastDeltaSeenEqualToPrerequest =
      sessionState.prerequestContent?.lastDeltaSeen.commitHash ==
        changeNotice.lastDeltaSeen.commitHash &&
      changeNotice.lastDeltaSeen.deltaIndexInCommit ===
        sessionState.prerequestContent?.lastDeltaSeen.deltaIndexInCommit;

    if (
      myChanges &&
      sessionState.prerequestContent &&
      isLastDeltaSeenEqualToPrerequest
    ) {
      contentToApplyTo = sessionState.prerequestContent?.content;
      ephemeralToApplyTo = sessionState.prerequestContent.ephemeral;
    }

    for (const delta of changes.deltas) {
       contentToApplyTo = workspace.engine.applyDelta(
        contentToApplyTo,
        delta
      );
    }
    sessionState.currentContent = contentToApplyTo;
    sessionState.ephemeral = ephemeralToApplyTo;

    sessionState.uncommittedChanges.deltas = [
      ...sessionState.uncommittedChanges.deltas,
      ...changes.deltas,
    ];

    for (const [author, newFolkChanges] of Object.entries(
      sessionState.uncommittedChanges.authors
    )) {
      if (!sessionState.uncommittedChanges.authors[author]) {
        sessionState.uncommittedChanges.authors[author] = newFolkChanges;
      } else {
        const folkChanges = sessionState.uncommittedChanges.authors[author];
        if (
          folkChanges.atFolkIndex + folkChanges.commitChanges.length !==
          newFolkChanges.atFolkIndex
        ) {
          // We missed changes from this folk?
        }
        folkChanges.commitChanges = [
          ...folkChanges.commitChanges,
          ...newFolkChanges.commitChanges,
        ];
      }
    }

    if (myChanges) {
      clearRequested(
        sessionState,
        myChanges,
        sessionState.currentContent,
        sessionState.ephemeral
      );
    }

    return state;
  });
}

function clearRequested<E extends SynEngine<any, any>>(
  sessionState: SessionState<E>,
  myChanges: FolkChanges,
  newContent: EngineContent<E>,
  newEphemeral: EngineEphemeralState<E>
) {
  const leftRequestedChanges: RequestedChange[] = [];

  for (const requestedChange of sessionState.requestedChanges) {
    if (
      !(
        requestedChange.atFolkIndex >= myChanges.atFolkIndex &&
        requestedChange.atFolkIndex <
          myChanges.atFolkIndex + myChanges.commitChanges.length
      )
    ) {
      leftRequestedChanges.push(requestedChange);
    }
  }
  sessionState.requestedChanges = leftRequestedChanges;

  if (sessionState.requestedChanges.length === 0) {
    sessionState.prerequestContent = undefined;
  } else {
    sessionState.prerequestContent = {
      lastDeltaSeen: selectLastDeltaSeen(sessionState),
      content: newContent,
      ephemeral: newEphemeral,
    };
  }
}
