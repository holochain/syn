import type { Session } from '@syn/zome-client';
import type { Readable } from 'svelte/store';
import { derived } from 'svelte/store';
import type { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SessionFolk } from './state/syn-state';
import type { SynWorkspace } from './internal/workspace';

export type { SessionFolk };

import { selectSession } from './state/selectors';
import { requestChange } from './internal/workflows/change';

export interface SessionStore<CONTENT, DELTA> {
  content: Readable<CONTENT>;
  folks: Readable<Dictionary<SessionFolk>>;
  info: Readable<{ sessionHash: EntryHashB64; session: Session }>;

  requestChange(deltas: DELTA[]): void;
  leave(): Promise<void>;
}

export function buildSessionStore<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
): SessionStore<CONTENT, DELTA> {
  const content = derived(
    workspace.store,
    state => selectSession(state, sessionHash).currentContent
  );
  const folks = derived(
    workspace.store,
    state => selectSession(state, sessionHash).folks
  );
  const info = derived(workspace.store, state => ({
    session: selectSession(state, sessionHash).session,
    sessionHash,
  }));

  return {
    content,
    folks,
    info,
    requestChange: deltas => requestChange(workspace, sessionHash, deltas),
    leave: async () => {}, // TODO
  };
}
