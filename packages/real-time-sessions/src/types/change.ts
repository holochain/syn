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

  stateChanges: BinaryChange[];
  ephemeralChanges: BinaryChange[];
}

export interface ChangeRequest {
  folk: AgentPubKeyB64;
  scribe: AgentPubKeyB64;

  stateChanges: BinaryChange[];
  ephemeralChanges: BinaryChange[];
}

export interface SendChangeInput {
  participants: Array<AgentPubKeyB64>;
  sessionHash: EntryHashB64;

  stateChanges: BinaryChange[];
  ephemeralChanges: BinaryChange[];
}

export interface ChangeNotice {
  stateChanges: BinaryChange[];
  ephemeralChanges: BinaryChange[];
}
