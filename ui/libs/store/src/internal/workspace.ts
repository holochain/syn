import type { SynClient } from '@syn/zome-client';

import type { SynState } from '../state/syn-state';
import type { Writable } from 'svelte/store';
import type { ApplyDeltaFn } from '../apply-delta';
import type { SynConfig } from '../config';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';

export interface SynWorkspace<CONTENT, DELTA> {
  client: SynClient;
  store: Writable<SynState>;
  initialSnapshot: CONTENT;
  applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>;
  config: SynConfig;
  listeners: Array<SynEventListener>;
}

export interface SynEventListener {
  event: SynEvent;
  sessionHash: EntryHashB64;
  listener: () => void;
}

export type SynEvent = 'session-closed';
