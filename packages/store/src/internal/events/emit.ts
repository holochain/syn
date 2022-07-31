import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { SynGrammar } from '../../grammar';
import type { SynWorkspace } from '../workspace';
import type { SessionEvent } from './types';

export function emitEvent<
  G extends SynGrammar<any, any>,
  S extends SessionEvent
>(workspace: SynWorkspace<G>, sessionHash: EntryHashB64, event: S) {
  for (const listener of workspace.listeners) {
    if (listener.event === event.type && listener.sessionHash === sessionHash) {
      listener.listener(event.payload);
    }
  }
}
