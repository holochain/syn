import type { ChangeBundle } from "./delta";
import type { EntryHashB64, AgentPubKeyB64, Dictionary } from "@holochain-open-dev/core-types";
import type { Commit } from "./commit";
export interface SendSyncRequestInput {
    sessionHash: EntryHashB64;
    scribe: AgentPubKeyB64;
    lastSessionIndexSeen: number;
}
export interface RequestSyncInput {
    folk: AgentPubKeyB64;
    scribe: AgentPubKeyB64;
    lastSessionIndexSeen: number;
}
export interface StateForSync {
    missedCommits: Dictionary<Commit>;
    uncommittedChanges: ChangeBundle;
}
export interface SendSyncResponseInput {
    sessionHash: EntryHashB64;
    participant: AgentPubKeyB64;
    state: StateForSync;
}
