import { Writable } from 'svelte/store';
import { Commit, SynClient, Workspace } from '@holochain-syn/client';
import { EntryHash } from '@holochain/client';
import { EntryHashMap, EntryRecord, RecordBag } from '@holochain-open-dev/utils';
import { RecursivePartial, SynConfig } from './config';
import type { SynGrammar } from './grammar';
import { WorkspaceStore } from './workspace-store';
export declare class RootStore<G extends SynGrammar<any, any>> {
    client: SynClient;
    grammar: G;
    root: EntryRecord<Commit>;
    /** Public accessors */
    knownWorkspaces: Writable<EntryHashMap<Workspace>>;
    knownCommits: Writable<RecordBag<Commit>>;
    constructor(client: SynClient, grammar: G, root: EntryRecord<Commit>);
    get myPubKey(): Uint8Array;
    fetchWorkspaces(): Promise<import("svelte/store").Readable<EntryHashMap<Workspace>>>;
    fetchCommits(): Promise<import("svelte/store").Readable<RecordBag<Commit>>>;
    fetchCommit(commitHash: EntryHash): Promise<Commit | undefined>;
    joinWorkspace(workspaceHash: EntryHash, config?: RecursivePartial<SynConfig>): Promise<WorkspaceStore<G>>;
    createWorkspace(workspaceName: string, initialTipHash: EntryHash): Promise<EntryHash>;
}
