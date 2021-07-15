import type { ChangeBundle } from "./delta";
import type {
  EntryHashB64,
  AgentPubKeyB64,
  Dictionary,
} from "@holochain-open-dev/core-types";
import type { Commit } from "./commit";

// Sent by the folk
export interface SendSyncRequestInput {
  sessionHash: EntryHashB64;
  scribe: AgentPubKeyB64;
  lastSessionIndexSeen: number;
}

// Received by the scribe
export interface RequestSyncInput {
  folk: AgentPubKeyB64;

  scribe: AgentPubKeyB64;
  lastSessionIndexSeen: number;
}

export interface StateForSync {
  // Will contain the newer commits since `lastSessionIndexSeen`
  missedCommits: Dictionary<Commit>;

  uncommittedChanges: ChangeBundle;

  //currentContentHash: EntryHashB64;
}

export interface SendSyncResponseInput {
  sessionHash: EntryHashB64;
  participant: AgentPubKeyB64;
  state: StateForSync;
}
