import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { get } from 'svelte/store';
import type {
  EngineDelta,
  EngineEphemeralChanges,
  SynEngine,
} from '../../../engine';

import { amIScribe } from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';
import { folkRequestChange } from './folk';
import { scribeRequestChange } from './scribe';

// Folk or scribe
export function requestChanges<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64,
  deltas: Array<EngineDelta<E>>,
  ephemeralChanges: EngineEphemeralChanges<E>
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
