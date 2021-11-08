import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { EphemeralChanges } from '@syn/zome-client';
import { get } from 'svelte/store';

import { amIScribe } from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import { folkRequestChange } from './folk';
import { scribeRequestChange } from './scribe';

// Folk or scribe
export function requestChanges<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  sessionHash: EntryHashB64,
  deltas: DELTA[],
  ephemeralChanges: EphemeralChanges
): void {
  const state = get(workspace.store);

  if (amIScribe(state, sessionHash))
    return scribeRequestChange(
      workspace,
      sessionHash,
      deltas,
      ephemeralChanges
    );
  else
    return folkRequestChange(workspace, sessionHash, deltas, ephemeralChanges);
}
