import { derived, Readable, writable } from 'svelte/store';
import type {
  AgentPubKeyB64,
  Dictionary,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type { CellClient } from '@holochain-open-dev/cell-client';
import { serializeHash } from '@holochain-open-dev/core-types';
import { Session, SynClient } from '@syn/zome-client';
import { merge } from 'lodash-es';

import type { ApplyDeltaFn } from './apply-delta';
import { initialState } from './state/syn-state';
import type { SynState } from './state/syn-state';
import type { SynWorkspace } from './internal/workspace';
import { handleSignal } from './internal/signals';
import { defaultConfig, RecursivePartial, SynConfig } from './config';
import { initBackgroundTasks } from './internal/tasks';
import { joinSession } from './internal/workflows/sessions/folk';
import { buildSessionStore, SessionStore } from './session-store';
import { newSession } from './internal/workflows/sessions/scribe';

export interface SynStore<CONTENT, DELTA> {
  myPubKey: AgentPubKeyB64;

  getAllSessions(): Promise<Dictionary<Session>>;

  activeSession: Readable<SessionStore<CONTENT, DELTA> | undefined>;
  joinedSessions: Readable<EntryHashB64[]>;
  knownSessions: Readable<Dictionary<Session>>;
  sessionStore: (sessionHash: EntryHashB64) => SessionStore<CONTENT, DELTA>;

  newSession(fromSnapshot?: EntryHashB64): Promise<EntryHashB64>;
  joinSession(sessionHash: EntryHashB64): Promise<void>;

  close: () => Promise<void>;
}

export function createSynStore<CONTENT, DELTA>(
  cellClient: CellClient,
  initialContent: CONTENT,
  applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>,
  config?: RecursivePartial<SynConfig>
): SynStore<CONTENT, DELTA> {
  let workspace: SynWorkspace<CONTENT, DELTA> = undefined as any;

  const fullConfig = merge(config, defaultConfig());

  const myPubKey = serializeHash(cellClient.cellId[1]);
  const state: SynState = initialState(myPubKey);

  const store = writable(state);

  const client = new SynClient(cellClient, signal =>
    handleSignal(workspace, signal)
  );

  workspace = {
    store,
    applyDeltaFn,
    client,
    initialContent,
    config: fullConfig,
  };

  const { cancel } = initBackgroundTasks(workspace);

  const activeSession = derived(store, state => {
    if (state.activeSessionHash)
      return buildSessionStore(workspace, state.activeSessionHash);
  });

  return {
    myPubKey,
    getAllSessions: async () => {
      const sessions = await client.getSessions();
      workspace.store.update(state => {
        state.sessions = {
          ...state.sessions,
          ...sessions,
        };
        return state;
      });

      return sessions;
    },
    joinSession: async sessionHash => joinSession(workspace, sessionHash),
    activeSession,
    joinedSessions: derived(workspace.store, state =>
      Object.keys(state.joinedSessions)
    ),
    knownSessions: derived(workspace.store, state => state.sessions),
    sessionStore: sessionHash => buildSessionStore(workspace, sessionHash),
    newSession: async (fromSnapshot?: EntryHashB64) =>
      newSession(workspace, fromSnapshot),
    close: async () => {
      client.close();
      cancel();
    },
  };
}
