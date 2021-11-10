import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';

export interface Session {
  initialCommitHash: EntryHashB64 | undefined;
  scribe: AgentPubKeyB64;
  createdAt: number;
}

export interface SessionInfo {
  sessionHash: EntryHashB64;
  session: Session;
}

export interface NewSessionInput {
  initialCommitHash: EntryHashB64 | undefined;
}

export interface CloseSessionInput {
  sessionHash: EntryHashB64;
}
