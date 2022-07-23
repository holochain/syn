import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import { get } from 'svelte/store';
import type { Commit } from '@holochain-syn/client';

import {
  selectFolksInSession,
  selectSessionState,
} from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import { commitChanges } from '../commit/scribe';
import type { GrammarState, SynGrammar } from '../../../grammar';
import { change, clone, Doc, FreezeObject, init, load } from 'automerge';

export function getCommitSnapshot() {}

export async function getInitialSessionSnapshot<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  initialCommitHash: EntryHashB64 | undefined
): Promise<Doc<GrammarState<G>>> {
  const document = init({
    actorId: workspace.myPubKey,
  });
  let currentContent = change(document, doc =>
    workspace.grammar.initialState(doc)
  ) as FreezeObject<GrammarState<G>>;

  if (initialCommitHash) {
    const currentCommit = await workspace.client.getCommit(initialCommitHash);

    if (!currentCommit)
      throw new Error("Can't fetch the requested commit: try again later");

    const contentBytes = await workspace.client.getSnapshot(
      (currentCommit as Commit).newContentHash
    );
    currentContent = load(contentBytes);

    workspace.store.update(state => {
      state.commits[initialCommitHash] = currentCommit;
      state.snapshots[(currentCommit as Commit).newContentHash] = contentBytes;

      return state;
    });
  }

  return currentContent;
}

// Pick and join a session
export async function newSession<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  fromCommit?: EntryHashB64
): Promise<EntryHashB64> {
  const initialSessionContent = await getInitialSessionSnapshot(
    workspace,
    fromCommit
  );

  if (!fromCommit) {
    await workspace.client.putSnapshot(clone(initialSessionContent));
  }
  const session = await workspace.client.newSession({
    initialCommitHash: fromCommit,
  });

  workspace.store.update(state => {
    state.sessions[session.sessionHash] = session.session;

    state.joinedSessions[session.sessionHash] = {
      lastCommitHash: fromCommit,
      sessionHash: session.sessionHash,
      currentContent: initialSessionContent,
      unpublishedChanges: [],
      syncStates: {},

      folks: {},
    };

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
  const state = get(workspace.store);
  const session = selectSessionState(state, sessionHash);

  let closingCommitHash: EntryHashB64 | undefined;

  if (session) {
    closingCommitHash = await commitChanges(workspace, sessionHash);
  }

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
