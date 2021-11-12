import { derived, get, Readable, writable } from 'svelte/store';
import type {
  AgentPubKeyB64,
  Dictionary,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type { CellClient } from '@holochain-open-dev/cell-client';
import { serializeHash } from '@holochain-open-dev/core-types';
import { Commit, Session, SynClient } from '@syn/zome-client';
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
import { closeSession, newSession } from './internal/workflows/sessions/scribe';
import cloneDeep from 'lodash-es/cloneDeep';
import { leaveSession } from './internal/workflows/sessions';

export class SynStore<CONTENT, DELTA> {
  /** Private fields */
  #workspace: SynWorkspace<CONTENT, DELTA>;
  #cancelBackgroundTasks: () => void;

  /** Public accessors */
  myPubKey: AgentPubKeyB64;
  activeSession: Readable<SessionStore<CONTENT, DELTA> | undefined>;
  joinedSessions: Readable<EntryHashB64[]>;
  knownSessions: Readable<Dictionary<Session>>;
  allCommits: Readable<Dictionary<Commit>>;
  snapshots: Readable<Dictionary<CONTENT>>;

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
      initialSnapshot: cloneDeep(initialContent),
      config: fullConfig,
      listeners: [],
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
    this.allCommits = derived(this.#workspace.store, state => state.commits);
    this.snapshots = derived(this.#workspace.store, state => state.snapshots);
  }

  get config() {
    return this.#workspace.config;
  }

  async getAllSessions() {
    const sessions = await this.#workspace.client.getSessions();

    const state = get(this.#workspace.store);

    const sessionsToClose = Object.entries(sessions)
      .filter(
        ([hash, session]) =>
          session.scribe === this.myPubKey && !state.joinedSessions[hash]
      )
      .map(([hash, _]) => hash);

    this.#workspace.store.update(state => {
      for (const [hash, session] of Object.entries(sessions)) {
        if (!sessionsToClose.includes(hash)) {
          state.sessions[hash] = session;
        }
      }

      return state;
    });

    for (const sessionHash of sessionsToClose) {
      await closeSession(this.#workspace, sessionHash);
    }

    return sessions;
  }

  async joinSession(sessionHash: EntryHashB64) {
    await joinSession(this.#workspace, sessionHash);

    return buildSessionStore(this.#workspace, sessionHash);
  }

  sessionStore(sessionHash: EntryHashB64) {
    return buildSessionStore(this.#workspace, sessionHash);
  }

  async newSession(fromSnapshot?: EntryHashB64) {
    const sessionHash = await newSession(this.#workspace, fromSnapshot);
    return buildSessionStore(this.#workspace, sessionHash);
  }

  async fetchCommitHistory() {
    const commits = await this.#workspace.client.getAllCommits();

    this.#workspace.store.update(state => {
      for (const key of Object.keys(commits)) {
        state.commits[key] = commits[key];
      }

      return state;
    });
  }

  async fetchSnapshot(snapshotHash: EntryHashB64) {
    const state = get(this.#workspace.store);

    if (state.snapshots[snapshotHash]) return;

    const snapshot = await this.#workspace.client.getSnapshot(snapshotHash);

    this.#workspace.store.update(state => {
      state.snapshots[snapshotHash] = snapshot;
      return state;
    });
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
