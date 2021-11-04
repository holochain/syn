import type { AgentPubKeyB64, EntryHashB64, Dictionary } from "@holochain-open-dev/core-types";
export declare type Delta = any;
export interface FolkChanges {
    atFolkIndex: number;
    sessionChanges: Array<number>;
}
export interface ChangeBundle {
    atSessionIndex: number;
    deltas: Array<Delta>;
    authors: Dictionary<FolkChanges>;
}
export interface SendChangeRequestInput {
    sessionHash: EntryHashB64;
    scribe: AgentPubKeyB64;
    atSessionIndex: number;
    atFolkIndex: number;
    deltas: Array<Delta>;
}
export interface ChangeRequest {
    folk: AgentPubKeyB64;
    scribe: AgentPubKeyB64;
    atFolkIndex: number;
    atSessionIndex: number;
    deltas: Array<Delta>;
}
export interface SendChangeInput {
    participants: Array<AgentPubKeyB64>;
    sessionHash: EntryHashB64;
    changes: ChangeBundle;
}
