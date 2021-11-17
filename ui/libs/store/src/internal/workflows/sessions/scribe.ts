import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import { get } from 'svelte/store';
import type { Commit } from '@syn/zome-client';
import cloneDeep from 'lodash-es/cloneDeep';

import {
  selectFolksInSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import { commitChanges } from '../commit/scribe';
import type { SynGrammar } from '../../../grammar';

// Pick and join a session
export async function newSession<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  fromCommit?: EntryHashB64
): Promise<EntryHashB64> {
  let currentContent = cloneDeep(workspace.grammar.initialState);
  let currentCommit: Commit | undefined;

  if (fromCommit) {
    currentCommit = await workspace.client.getCommit(fromCommit);

    currentContent = await workspace.client.getSnapshot(
      (currentCommit as Commit).newContentHash
    );
  } else {
    await workspace.client.putSnapshot(workspace.grammar.initialState);
  }
  const session = await workspace.client.newSession({
    initialCommitHash: fromCommit,
  });

  workspace.store.update(state => {
    state.sessions[session.sessionHash] = session.session;

    state.joinedSessions[session.sessionHash] = {
      lastCommitHash: fromCommit,
      sessionHash: session.sessionHash,
      currentContent,
      myFolkIndex: 0,
      prerequestContent: undefined,
      requestedChanges: [],
      uncommittedChanges: {
        authors: {},
        deltas: [],
      },
      folks: {},
    };
    if (fromCommit && currentCommit) {
      state.snapshots[currentCommit?.newContentHash] =
        cloneDeep(currentContent);
      state.commits[fromCommit] = currentCommit;
    }

    state.activeSessionHash = session.sessionHash;

    return state;
  });

  return session.sessionHash;
}

export async function handleLeaveSessionNotice<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  folk: AgentPubKeyB64
): Promise<void> {
  workspace.store.update(state => {
    const sessionState = selectSessionState(state, sessionHash);

    delete sessionState.folks[folk];

    workspace.client.sendFolkLore({
      folkLore: sessionState.folks,
      participants: selectFolksInSession(workspace, sessionState),
      sessionHash,
    });

    return state;
  });
}

export interface CloseSessionResult {
  closingCommitHash: EntryHashB64 | undefined;
}
export async function closeSession<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64
): Promise<CloseSessionResult> {
  const closingCommitHash = await commitChanges(workspace, sessionHash);

  const state = get(workspace.store);

  const session = selectSessionState(state, sessionHash);
  const participants = session ? selectFolksInSession(workspace, session) : [];

  await workspace.client.closeSession({
    sessionHash,
    participants,
  });

  workspace.store.update(state => {
    delete state.sessions[sessionHash];

    (state.joinedSessions[sessionHash] as any) = undefined;
    delete state.joinedSessions[sessionHash];
    if (state.activeSessionHash === sessionHash)
      state.activeSessionHash = undefined;
    return state;
  });

  return { closingCommitHash };
}
