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
import type { GrammarDelta, SynGrammar } from '../../../grammar';

export function folkRequestChange<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  deltas: Array<GrammarDelta<G>>
) {
  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);

    const lastDeltaSeen = selectLastDeltaSeen(sessionState);

    // TODO: don't do this if strategy === CRDT
    if (!sessionState.prerequestContent) {
      sessionState.prerequestContent = {
        lastDeltaSeen,
        content: cloneDeep(sessionState.currentContent),
      };
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

    sessionState.requestedChanges = [
      ...sessionState.requestedChanges,
      ...newRequestedChanges,
    ];

    workspace.client.sendChangeRequest({
      lastDeltaSeen,
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

    if (!changeNotice.deltaChanges) return state;

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

    if (sessionState.prerequestContent && isLastDeltaSeenEqualToPrerequest) {
      contentToApplyTo = sessionState.prerequestContent.content;
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

    if (sessionState.requestedChanges.length === 0) {
      sessionState.prerequestContent = undefined;
      sessionState.currentContent = contentToApplyTo;
    } else {
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
