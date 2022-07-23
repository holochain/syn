import type {
  AgentPubKeyB64,
  EntryHashB64,
  Dictionary,
} from '@holochain-open-dev/core-types';
import { BinaryChange } from 'automerge';

export type Delta = BinaryChange;

export interface FolkChanges {
  atFolkIndex: number;
  commitChanges: Array<number>;
}

export interface AuthoredDelta {
  author: AgentPubKeyB64;
  delta: Delta;
}

export interface ChangeBundle {
  // Indexed by commit index
  deltas: Array<AuthoredDelta>;
  // AgentPubKeyB64 -> folkIndex -> sessionIndex
  authors: Dictionary<FolkChanges>;
}

// From folk to scribe
export interface SendChangeRequestInput {
  sessionHash: EntryHashB64;
  scribe: AgentPubKeyB64;

  deltas: Delta[];
}

export interface DeltaChanges {
  atFolkIndex: number;
  deltas: Array<Delta>;
}

export interface ChangeRequest {
  folk: AgentPubKeyB64;
  scribe: AgentPubKeyB64;

  deltas: Delta[];
}

export interface SendChangeInput {
  participants: Array<AgentPubKeyB64>;
  sessionHash: EntryHashB64;

  deltas: Delta[];
}

export interface ChangeNotice {

  deltas: Delta[];
}
