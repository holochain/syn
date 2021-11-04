import type { Session } from '@syn/zome-client';
import type { Readable } from 'svelte/store';
import type { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';
import type { SessionFolk } from './state/syn-state';
import type { SynWorkspace } from './internal/workspace';
export type { SessionFolk };
export interface SessionStore<CONTENT, DELTA> {
    sessionHash: EntryHashB64;
    session: Session;
    content: Readable<CONTENT>;
    folks: Readable<Dictionary<SessionFolk>>;
    requestChange(deltas: DELTA[]): void;
    leave(): Promise<void>;
}
export declare function buildSessionStore<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64): SessionStore<CONTENT, DELTA>;
