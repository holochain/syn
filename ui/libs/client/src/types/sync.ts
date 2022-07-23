import type {
  EntryHashB64,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';
import { BinarySyncMessage } from 'automerge';

// Sent by the folk
export interface SendSyncRequestInput {
  sessionHash: EntryHashB64;
  scribe: AgentPubKeyB64;
  syncMessage: BinarySyncMessage;
}

// Received by the scribe
export interface RequestSyncInput {
  folk: AgentPubKeyB64;
  scribe: AgentPubKeyB64;

  syncMessage: BinarySyncMessage;
}

export interface SyncResponseInput {
  syncMessage: BinarySyncMessage;
}
