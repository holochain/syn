import type {
  AgentPubKeyB64,
  EntryHashB64,
  Dictionary,
} from '@holochain-open-dev/core-types';

export type Delta = any;

export interface FolkChanges {
  atFolkIndex: number;
  commitChanges: Array<number>;
}

export interface ChangeBundle {
  // Indexed by commit index
  deltas: Array<Delta>;
  // AgentPubKeyB64 -> folkIndex -> sessionIndex
  authors: Dictionary<FolkChanges>;
}

// From folk to scribe
export interface SendChangeRequestInput {
  sessionHash: EntryHashB64;
  scribe: AgentPubKeyB64;
  lastDeltaSeen: LastDeltaSeen;

  deltaChanges: DeltaChanges | undefined;
  ephemeralChanges: EphemeralChanges | undefined;
}

export interface DeltaChanges {
  atFolkIndex: number;
  deltas: Array<Delta>;
}

export type EphemeralChanges = any;
export type EphemeralState = any;

export interface LastDeltaSeen {
  commitHash: EntryHashB64 | undefined;
  deltaIndexInCommit: number;
}

export interface ChangeRequest {
  folk: AgentPubKeyB64;
  scribe: AgentPubKeyB64;

  lastDeltaSeen: LastDeltaSeen;

  deltaChanges: DeltaChanges | undefined;
  ephemeralChanges: EphemeralChanges | undefined;
}

export interface SendChangeInput {
  participants: Array<AgentPubKeyB64>;
  sessionHash: EntryHashB64;
  lastDeltaSeen: LastDeltaSeen;

  deltaChanges: ChangeBundle | undefined;
  ephemeralChanges: EphemeralChanges | undefined;
}

export interface ChangeNotice {
  lastDeltaSeen: LastDeltaSeen;

  deltaChanges: ChangeBundle | undefined;
  ephemeralChanges: EphemeralChanges | undefined;
}
