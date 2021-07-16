import type {
  AgentPubKeyB64,
  EntryHashB64,
  Dictionary,
} from "@holochain-open-dev/core-types";

export type Delta = any;

export interface FolkChanges {
  atFolkIndex: number;
  sessionChanges: Array<number>;
}

export interface ChangeBundle {
  atSessionIndex: number;
  // Session Index from atSessionIndex -> Delta
  deltas: Array<Delta>;
  // AgentPubKeyB64 -> folkIndex -> sessionIndex
  authors: Dictionary<FolkChanges>;
}

// From folk to scribe
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
