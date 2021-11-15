import type { SynClient } from '@syn/zome-client';

import type { SynState } from '../state/syn-state';
import type { Writable } from 'svelte/store';
import type { SynConfig } from '../config';
import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type { SynEngine } from '../engine';

export interface SynWorkspace<E extends SynEngine<any, any>> {
  client: SynClient;
  store: Writable<SynState<E>>;
  engine: E;
  config: SynConfig;
  listeners: Array<SynEventListener>;
  myPubKey: AgentPubKeyB64;
}

export interface SynEventListener {
  event: SynEvent;
  sessionHash: EntryHashB64;
  listener: () => void;
}

export type SynEvent = 'session-closed';
