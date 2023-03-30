import { Writable } from 'svelte/store';
import { Commit, SynClient } from '@holochain-syn/client';
import Automerge from 'automerge';
import { RecordBag } from '@holochain-open-dev/utils';
import type { SynGrammar } from './grammar';
import { RootStore } from './root-store';
export declare const stateFromCommit: (commit: Commit) => Automerge.FreezeObject<unknown>;
export declare class SynStore {
    client: SynClient;
    /** Public accessors */
    knownRoots: Writable<RecordBag<Commit>>;
    constructor(client: SynClient);
    get myPubKey(): Uint8Array;
    fetchAllRoots(): Promise<import("svelte/store").Readable<RecordBag<Commit>>>;
    createRoot<G extends SynGrammar<any, any>>(grammar: G, meta?: any): Promise<RootStore<G>>;
    createDeterministicRoot<G extends SynGrammar<any, any>>(grammar: G, meta?: any): Promise<RootStore<G>>;
}
