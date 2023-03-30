import { Readable, Writable } from 'svelte/store';
import { AgentPubKeyMap } from '@holochain-open-dev/utils';
import Automerge from 'automerge';
import { AgentPubKey, EntryHash } from '@holochain/client';
import type { GrammarState, GrammarDelta, SynGrammar, GrammarEphemeralState } from './grammar';
import { SynConfig } from './config';
import { RootStore } from './root-store';
export interface SliceStore<G extends SynGrammar<any, any>> {
    myPubKey: AgentPubKey;
    worskpace: WorkspaceStore<any>;
    state: Readable<Automerge.Doc<GrammarState<G>>>;
    ephemeral: Readable<GrammarEphemeralState<G>>;
    requestChanges(changes: Array<GrammarDelta<G>>): void;
}
export declare function extractSlice<G1 extends SynGrammar<any, any>, G2 extends SynGrammar<any, any>>(sliceStore: SliceStore<G1>, wrapChange: (change: GrammarDelta<G2>) => GrammarDelta<G1>, sliceState: (state: Automerge.Doc<GrammarState<G1>>) => Automerge.Doc<GrammarState<G2>>, sliceEphemeral: (ephemeralState: Automerge.Doc<GrammarEphemeralState<G1>>) => Automerge.Doc<GrammarEphemeralState<G2>>): SliceStore<G2>;
export interface WorkspaceParticipant {
    lastSeen: number | undefined;
    syncStates: {
        state: Automerge.SyncState;
        ephemeral: Automerge.SyncState;
    };
}
export declare class WorkspaceStore<G extends SynGrammar<any, any>> implements SliceStore<G> {
    protected rootStore: RootStore<G>;
    protected config: SynConfig;
    workspaceHash: EntryHash;
    get worskpace(): this;
    _participants: Writable<AgentPubKeyMap<WorkspaceParticipant>>;
    get participants(): Readable<{
        active: Uint8Array[];
        idle: Uint8Array[];
        offline: Uint8Array[];
    }>;
    _state: Writable<Automerge.Doc<GrammarState<G>>>;
    get state(): Readable<Automerge.FreezeObject<GrammarState<G>>>;
    _ephemeral: Writable<Automerge.Doc<GrammarEphemeralState<G>>>;
    get ephemeral(): Readable<any>;
    _currentTip: Writable<EntryHash>;
    get currentTip(): Readable<Uint8Array>;
    private unsubscribe;
    private intervals;
    get myPubKey(): Uint8Array;
    private constructor();
    static joinWorkspace<G extends SynGrammar<any, any>>(rootStore: RootStore<G>, config: SynConfig, workspaceHash: EntryHash): Promise<WorkspaceStore<G>>;
    requestChanges(changes: Array<GrammarDelta<G>>): void;
    private handleChangeNotice;
    requestSync(participant: AgentPubKey): void;
    private handleSyncRequest;
    commitChanges(meta?: any): Promise<void>;
    private handleHeartbeat;
    leaveWorkspace(): Promise<void>;
    private handleNewParticipant;
    private handleLeaveWorkspaceNotice;
}
