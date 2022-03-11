import type { SynClient } from '@holochain-syn/client';

import type { SynState } from '../state/syn-state';
import type { Writable } from 'svelte/store';
import type { SynConfig } from '../config';
import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import type { SynGrammar } from '../grammar';
import type { SynEventListener } from './events/types';

export interface SynWorkspace<G extends SynGrammar<any, any>> {
  client: SynClient;
  store: Writable<SynState<G>>;
  grammar: G;
  config: SynConfig;
  listeners: Array<SynEventListener<any>>;
  myPubKey: AgentPubKeyB64;
}
