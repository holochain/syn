import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { get } from 'svelte/store';
import type { GrammarDelta, SynGrammar } from '../../../grammar';

import { amIScribe } from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import { folkRequestChange } from './folk';
import { scribeRequestChange } from './scribe';

// Folk or scribe
export function requestChanges<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionHash: EntryHashB64,
  deltas: Array<GrammarDelta<G>>
): void {
  const state = get(workspace.store);

  if (amIScribe(state, sessionHash)) 
    scribeRequestChange(workspace, sessionHash, deltas);
  else return folkRequestChange(workspace, sessionHash, deltas);
}
