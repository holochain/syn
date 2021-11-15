import type { FolkInfo, Session } from '@syn/zome-client';
import type { Readable } from 'svelte/store';
import { derived, get } from 'svelte/store';
import type { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SynWorkspace } from './internal/workspace';

import { selectSessionState } from './state/selectors';
import { requestChanges } from './internal/workflows/change';
import { leaveSession } from './internal/workflows/sessions';
import type { CloseSessionResult } from './internal/workflows/sessions/scribe';
import pickBy from 'lodash-es/pickBy';
import type {
  EngineContent,
  EngineDelta,
  EngineEphemeralChanges,
  EngineEphemeralState,
  SynEngine,
} from './engine';

export interface SynSlice<E extends SynEngine<any, any>> {
  content: Readable<EngineContent<E>>;
  requestChanges(changes: ChangesRequested<E>): void;

  ephemeral: Readable<EngineEphemeralState<E>>;
}

export interface ChangesRequested<E extends SynEngine<any, any>> {
  deltas: Array<EngineDelta<E>>;
  ephemeral?: EngineEphemeralChanges<E>;
}

export interface SessionStore<E extends SynEngine<any, any>>
  extends SynSlice<E> {
  sessionHash: EntryHashB64;
  session: Session;
  folks: Readable<Dictionary<FolkInfo>>;
  lastCommitHash: Readable<EntryHashB64 | undefined>;

  leave(): Promise<CloseSessionResult | undefined>;
  onClose(listener: () => void): void;
}

export function buildSessionStore<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64
): SessionStore<E> {
  const content = derived(
    workspace.store,
    state => selectSessionState(state, sessionHash)?.currentContent
  );
  const lastCommitHash = derived(
    workspace.store,
    state => selectSessionState(state, sessionHash)?.lastCommitHash
  );
  const ephemeral = derived(
    workspace.store,
    state => selectSessionState(state, sessionHash)?.ephemeral
  );
  const folks = derived(workspace.store, state =>
    pickBy(
      selectSessionState(state, sessionHash)?.folks,
      (_, key) => key !== workspace.myPubKey
    )
  );

  const state = get(workspace.store);
  const session = state.sessions[sessionHash];

  return {
    sessionHash,
    session,
    lastCommitHash,
    folks,
    content,
    ephemeral,
    requestChanges: ({
      deltas,
      ephemeral,
    }: {
      deltas: Array<EngineDelta<E>>;
      ephemeral: EngineEphemeralChanges<E>;
    }) => requestChanges(workspace, sessionHash, deltas, ephemeral),
    leave: async () => leaveSession(workspace, sessionHash),
    onClose: (listener: () => void) =>
      workspace.listeners.push({
        event: 'session-closed',
        sessionHash,
        listener,
      }),
  };
}
