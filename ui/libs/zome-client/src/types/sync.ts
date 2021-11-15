import type { ChangeBundle, EphemeralState, LastDeltaSeen } from './change';
import type {
  EntryHashB64,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';
import type { Commit, Content } from './commit';

// Sent by the folk
export interface SendSyncRequestInput {
  sessionHash: EntryHashB64;
  scribe: AgentPubKeyB64;
  lastDeltaSeen: LastDeltaSeen | undefined;
}

// Received by the scribe
export interface RequestSyncInput {
  folk: AgentPubKeyB64;

  scribe: AgentPubKeyB64;
  lastDeltaSeen: LastDeltaSeen;
}

export interface MissedCommit {
  commitHash: EntryHashB64;
  commit: Commit;
  commitInitialSnapshot: Content;
}

export interface StateForSync {
  // Will contain the newer commits since `lastSessionIndexSeen`
  folkMissedLastCommit: MissedCommit | undefined;

  uncommittedChanges: ChangeBundle;

  ephemeralState: EphemeralState;

  //currentContentHash: EntryHashB64;
}

export interface SendSyncResponseInput {
  sessionHash: EntryHashB64;
  participant: AgentPubKeyB64;
  state: StateForSync;
}
