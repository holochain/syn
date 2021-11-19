import type {
  ChangeNotice,
  FolkChanges,
  LastDeltaSeen,
} from '@syn/zome-client';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import cloneDeep from 'lodash-es/cloneDeep';
import { get } from 'svelte/store';

import {
  amIScribe,
  selectLastDeltaSeen,
  selectSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import type { RequestedChange, SessionState } from '../../../state/syn-state';
import { joinSession } from '../sessions/folk';
import type { GrammarDelta, SynGrammar } from '../../../grammar';

export function folkRequestChange<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  deltas: Array<GrammarDelta<G>>
) {
  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);

    let lastDeltaSeen = selectLastDeltaSeen(sessionState);

    // TODO: don't do this if strategy === CRDT
    if (!sessionState.prerequestContent) {
      sessionState.prerequestContent = {
        lastDeltaSeen,
        content: cloneDeep(sessionState.currentContent),
      };
    } else {
      if (sessionState.nonRequestedChangesAtLastDeltaSeen) {
        lastDeltaSeen = sessionState.nonRequestedChangesAtLastDeltaSeen;
      } else {
        lastDeltaSeen = sessionState.prerequestContent.lastDeltaSeen;
      }
    }

    for (const delta of deltas) {
      sessionState.currentContent = workspace.grammar.applyDelta(
        sessionState.currentContent,
        delta,
        state.myPubKey
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
      sessionState.nonRequestedChanges.length === 0 ||
      sessionState.requestedChanges.length > 0
    )
      return state;

    const deltas = sessionState.nonRequestedChanges.map(r => r.delta);

    sessionState.requestedChanges = [
      ...sessionState.requestedChanges,
      ...sessionState.nonRequestedChanges,
    ];
    sessionState.nonRequestedChanges = [];

    workspace.client.sendChangeRequest({
      lastDeltaSeen:
        sessionState.nonRequestedChangesAtLastDeltaSeen as LastDeltaSeen,
      deltaChanges: {
        atFolkIndex: sessionState.nonRequestedChangesAtFolkIndex as number,
        deltas,
      },
      scribe: state.sessions[sessionHash].scribe,
      sessionHash,
    });
    sessionState.nonRequestedChangesAtFolkIndex = undefined;

    return state;
  });
}

export async function checkRequestedChanges<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
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

    const changes = changeNotice.deltaChanges;

    // TODO
    // If CRDT, we don't care about requested changes
    // If BlockOnConflict, we try to rebase and block if applyDelta returns conflict

    const myChanges = changes.authors[state.myPubKey];

    let contentToApplyTo = sessionState.currentContent;

    const isLastDeltaSeenEqualToPrerequest =
      sessionState.prerequestContent?.lastDeltaSeen.commitHash ==
        changeNotice.lastDeltaSeen.commitHash &&
      changeNotice.lastDeltaSeen.deltaIndexInCommit ===
        sessionState.prerequestContent?.lastDeltaSeen.deltaIndexInCommit;
    /* 
    console.log(
      'changenotice',
      sessionState.prerequestContent,
      changeNotice.lastDeltaSeen
    ); */
    if (sessionState.prerequestContent) {
      if (isLastDeltaSeenEqualToPrerequest) {
        console.log('changing the prerequestcontent');
        contentToApplyTo = sessionState.prerequestContent.content;
      } else {
        // We are receiving a change out of order, sorry but gotta nuke
        console.log(
          'We are receiving a change out of order, sorry but gotta nuke',
          sessionState.prerequestContent,
          changeNotice
        );

        workspace.client.sendSyncRequest({
          lastDeltaSeen: selectLastDeltaSeen(sessionState),
          scribe: selectSession(state, sessionHash).scribe,
          sessionHash,
        });
        sessionState.prerequestContent = undefined;
        sessionState.requestedChanges = [];
        sessionState.nonRequestedChanges = [];

        return state;
      }
    }

    for (const delta of changes.deltas) {
      contentToApplyTo = workspace.grammar.applyDelta(
        contentToApplyTo,
        delta.delta,
        delta.author
      );
    }

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
      clearRequested(sessionState, myChanges);
    }
    console.log('hey', sessionState, contentToApplyTo);
    if (
      sessionState.requestedChanges.length === 0 &&
      sessionState.nonRequestedChanges.length === 0
    ) {
      console.log('hey2', sessionState, contentToApplyTo);
      sessionState.prerequestContent = undefined;
      sessionState.currentContent = contentToApplyTo;

      sessionState.nonRequestedChangesAtLastDeltaSeen = undefined;
    } else {
      console.log('hey3', sessionState, contentToApplyTo);
      sessionState.prerequestContent = {
        lastDeltaSeen: selectLastDeltaSeen(sessionState),
        content: contentToApplyTo,
      };
    }
    return state;
  });
}

function clearRequested<G extends SynGrammar<any, any>>(
  sessionState: SessionState<G>,
  myChanges: FolkChanges
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
}
