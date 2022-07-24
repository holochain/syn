import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import { BinaryChange } from 'automerge';

export type Delta = BinaryChange;

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
