import type { FolkInfo, Session } from '@syn/zome-client';
import type { Readable } from 'svelte/store';
import { derived, get } from 'svelte/store';
import type { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SynWorkspace } from './internal/workspace';

import { selectSessionState } from './state/selectors';
import { requestChanges } from './internal/workflows/change';
import { leaveSession } from './internal/workflows/sessions';
import type { CloseSessionResult } from './internal/workflows/sessions/scribe';
import { pickBy } from 'lodash-es';

export interface SessionStore<CONTENT, DELTA> {
  sessionHash: EntryHashB64;
  session: Session;

  content: Readable<CONTENT>;
  ephemeral: Readable<Dictionary<any>>;
  folks: Readable<Dictionary<FolkInfo>>;
  lastCommitHash: Readable<EntryHashB64 | undefined>;

  requestChanges(changes: RequestChanges<DELTA>): void;
  leave(): Promise<CloseSessionResult | undefined>;
  onClose(listener: () => void): void;
}

export type RequestChanges<DELTA> =
  | {
      deltas: DELTA[];
    }
  | {
      ephemeral: Dictionary<any>;
    }
  | {
      deltas: DELTA[];
      ephemeral: Dictionary<any>;
    };

export function buildSessionStore<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
): SessionStore<CONTENT, DELTA> {
  const content = derived(
    workspace.store,
    state => selectSessionState(state, sessionHash)?.currentContent
  );
  const lastCommitHash = derived(
    workspace.store,
    state => selectSessionState(state, sessionHash)?.currentCommitHash
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
    content,
    lastCommitHash,
    folks,
    ephemeral,
    requestChanges: ({
      deltas,
      ephemeral,
    }: {
      deltas: DELTA[];
      ephemeral: Dictionary<any>;
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
