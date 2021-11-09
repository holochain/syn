import { derived, get, Readable, writable } from 'svelte/store';
import type {
  AgentPubKeyB64,
  Dictionary,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type { CellClient } from '@holochain-open-dev/cell-client';
import { serializeHash } from '@holochain-open-dev/core-types';
import { Session, SynClient } from '@syn/zome-client';
import merge from 'lodash-es/merge';

import type { ApplyDeltaFn } from './apply-delta';
import { initialState } from './state/syn-state';
import type { SynState } from './state/syn-state';
import type { SynWorkspace } from './internal/workspace';
import { handleSignal } from './internal/signals';
import { defaultConfig, RecursivePartial, SynConfig } from './config';
import { initBackgroundTasks } from './internal/tasks';
import { joinSession } from './internal/workflows/sessions/folk';
import { buildSessionStore, SessionStore } from './session-store';
import { leaveSession, newSession } from './internal/workflows/sessions/scribe';

export class SynStore<CONTENT, DELTA> {
  /** Private fields */
  #workspace: SynWorkspace<CONTENT, DELTA>;
  #cancelBackgroundTasks: () => void;

  /** Public accessors */
  myPubKey: AgentPubKeyB64;
  activeSession: Readable<SessionStore<CONTENT, DELTA> | undefined>;
  joinedSessions: Readable<EntryHashB64[]>;
  knownSessions: Readable<Dictionary<Session>>;

  constructor(
    cellClient: CellClient,
    initialContent: CONTENT,
    applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>,
    config?: RecursivePartial<SynConfig>
  ) {
    const fullConfig = merge(config, defaultConfig());

    this.myPubKey = serializeHash(cellClient.cellId[1]);
    const state: SynState = initialState(this.myPubKey);

    const store = writable(state);

    const client = new SynClient(cellClient, signal =>
      handleSignal(this.#workspace, signal)
    );

    this.#workspace = {
      store,
      applyDeltaFn,
      client,
      initialSnapshot: initialContent,
      config: fullConfig,
    };

    this.activeSession = derived(this.#workspace.store, state => {
      if (state.activeSessionHash)
        return buildSessionStore(this.#workspace, state.activeSessionHash);
    });

    const { cancel } = initBackgroundTasks(this.#workspace);
    this.#cancelBackgroundTasks = cancel;

    this.joinedSessions = derived(this.#workspace.store, state =>
      Object.keys(state.joinedSessions)
    );
    this.knownSessions = derived(
      this.#workspace.store,
      state => state.sessions
    );
  }

  async getAllSessions() {
    const sessions = await this.#workspace.client.getSessions();
    this.#workspace.store.update(state => {
      state.sessions = {
        ...state.sessions,
        ...sessions,
      };
      return state;
    });

    return sessions;
  }

  async joinSession(sessionHash: EntryHashB64) {
    return joinSession(this.#workspace, sessionHash);
  }

  sessionStore(sessionHash: EntryHashB64) {
    return buildSessionStore(this.#workspace, sessionHash);
  }

  async newSession(fromSnapshot?: EntryHashB64) {
    return newSession(this.#workspace, fromSnapshot);
  }

  async getCommitTips() {
    const commitTips = await this.#workspace.client.getCommitTips();

    this.#workspace.store.update(state => {
      for (const key of Object.keys(commitTips)) {
        state.commits[key] = commitTips[key];
      }

      return state;
    });

    return commitTips;
  }

  async close() {
    const joinedSessionHashes = get(this.joinedSessions);

    // Sequential to avoid concurrent writes
    for (const hash of joinedSessionHashes) {
      await leaveSession(this.#workspace, hash);
    }

    this.#workspace.client.close();
    this.#cancelBackgroundTasks();
  }
}
