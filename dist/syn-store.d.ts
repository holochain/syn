import { Readable } from 'svelte/store';
import type { AgentPubKeyB64, Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';
import type { CellClient } from '@holochain-open-dev/cell-client';
import { Session } from '@syn/zome-client';
import type { ApplyDeltaFn } from './apply-delta';
import { RecursivePartial, SynConfig } from './config';
import { SessionStore } from './session-store';
export interface SynStore<CONTENT, DELTA> {
    myPubKey: AgentPubKeyB64;
    getAllSessions(): Promise<Dictionary<Session>>;
    activeSession: Readable<SessionStore<CONTENT, DELTA> | undefined>;
    joinedSessions: Readable<EntryHashB64[]>;
    knownSessions: Readable<Dictionary<Session>>;
    sessionStore: (sessionHash: EntryHashB64) => SessionStore<CONTENT, DELTA>;
    newSession(fromSnapshot?: EntryHashB64): Promise<EntryHashB64>;
    joinSession(sessionHash: EntryHashB64): Promise<void>;
    close: () => Promise<void>;
}
export declare function createSynStore<CONTENT, DELTA>(cellClient: CellClient, initialContent: CONTENT, applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>, config?: RecursivePartial<SynConfig>): SynStore<CONTENT, DELTA>;
