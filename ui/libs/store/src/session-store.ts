import type { Session } from '@syn/zome-client';
import type { Readable } from 'svelte/store';
import { derived, get } from 'svelte/store';
import type { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';

import type { SessionFolk } from './state/syn-state';
import type { SynWorkspace } from './internal/workspace';

export type { SessionFolk };

import { selectSessionWorkspace } from './state/selectors';
import { requestChange } from './internal/workflows/change';

export interface SessionStore<CONTENT, DELTA> {
  sessionHash: EntryHashB64;
  session: Session;

  content: Readable<CONTENT>;
  folks: Readable<Dictionary<SessionFolk>>;

  requestChange(deltas: DELTA[]): void;
  leave(): Promise<void>;
}

export function buildSessionStore<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64
): SessionStore<CONTENT, DELTA> {
  const content = derived(
    workspace.store,
    state => selectSessionWorkspace(state, sessionHash).currentContent
  );
  const folks = derived(
    workspace.store,
    state => selectSessionWorkspace(state, sessionHash).folks
  );

  return {
    sessionHash: sessionHash,
    session: get(workspace.store).sessions[sessionHash],
    content,
    folks,
    requestChange: deltas => requestChange(workspace, sessionHash, deltas),
    leave: async () => {}, // TODO
  };
}
