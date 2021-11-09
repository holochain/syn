import type { Session } from '@syn/zome-client';
import type { Readable } from 'svelte/store';
import { derived, get } from 'svelte/store';
import type { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SessionFolk } from './state/syn-state';
import type { SynWorkspace } from './internal/workspace';

export type { SessionFolk };

import { selectSessionState } from './state/selectors';
import { requestChanges } from './internal/workflows/change';
import { leaveSession } from './internal/workflows/sessions/scribe';

export interface SessionStore<CONTENT, DELTA> {
  sessionHash: EntryHashB64;
  session: Session;

  content: Readable<CONTENT>;
  ephemeral: Readable<Dictionary<any>>;
  folks: Readable<Dictionary<SessionFolk>>;

  requestChanges(changes: RequestChanges<DELTA>): void;
  leave(): Promise<void>;
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
    state => selectSessionState(state, sessionHash).currentContent
  );
  const ephemeral = derived(
    workspace.store,
    state => selectSessionState(state, sessionHash).ephemeral
  );
  const folks = derived(
    workspace.store,
    state => selectSessionState(state, sessionHash).folks
  );

  const state = get(workspace.store);
  const session = state.sessions[sessionHash];

  return {
    sessionHash: sessionHash,
    session,
    content,
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
  };
}
