import type { EntryHashB64 } from '@holochain-open-dev/core-types';

export type SessionEventListener<SE extends SessionEvent> = (
  args: SE['payload']
) => void;

export interface SynEventListener<SE extends SessionEvent> {
  event: SE['type'];
  sessionHash: EntryHashB64;
  listener: SessionEventListener<SE>;
}

export type SessionEventType = 'session-closed';

export interface SessionEventContent<T extends SessionEventType, P> {
  type: T;
  payload: P;
}
export type SessionEvent = SessionEventContent<'session-closed', void>;
