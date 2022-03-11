import type { FolkInfo, Session } from '@holochain-syn/client';
import type { Readable } from 'svelte/store';
import { derived, get } from 'svelte/store';
import type { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SynWorkspace } from './internal/workspace';

import { selectSessionState } from './state/selectors';
import { requestChanges } from './internal/workflows/change';
import { leaveSession } from './internal/workflows/sessions';
import type { CloseSessionResult } from './internal/workflows/sessions/scribe';
import pickBy from 'lodash-es/pickBy';
import type { GrammarState, GrammarDelta, SynGrammar } from './grammar';

export interface SynSlice<G extends SynGrammar<any, any>> {
  state: Readable<GrammarState<G>>;

  requestChanges(deltas: Array<GrammarDelta<G>>): void;
}

export interface SessionStore<G extends SynGrammar<any, any>>
  extends SynSlice<G> {
  sessionHash: EntryHashB64;
  session: Session;
  folks: Readable<Dictionary<FolkInfo>>;
  lastCommitHash: Readable<EntryHashB64 | undefined>;

  leave(): Promise<CloseSessionResult | undefined>;
}

export function buildSessionStore<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64
): SessionStore<G> {
  const sessionState = derived(workspace.store, state =>
    selectSessionState(state, sessionHash)
  );
  const content = derived(sessionState, state => state?.currentContent);
  const lastCommitHash = derived(sessionState, state => state?.lastCommitHash);

  const folks = derived(sessionState, state =>
    pickBy(state?.folks, (_, key) => key !== workspace.myPubKey)
  );

  const state = get(workspace.store);
  const session = state.sessions[sessionHash];

  return {
    sessionHash,
    session,
    lastCommitHash,
    folks,
    state: content,
    requestChanges: (deltas: Array<GrammarDelta<G>>) =>
      requestChanges(workspace, sessionHash, deltas),
    leave: async () => leaveSession(workspace, sessionHash),
  };
}
