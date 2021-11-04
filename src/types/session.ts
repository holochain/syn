import type {
  AgentPubKeyB64,
  EntryHashB64,
  Dictionary,
} from "@holochain-open-dev/core-types";
import type { Content, Commit } from "./commit";

export interface Session {
  snapshotHash: EntryHashB64;
  scribe: AgentPubKeyB64;
  createdAt: number;
}

export interface SessionInfo {
  sessionHash: EntryHashB64;
  session: Session;
  commits: Dictionary<Commit>;
  snapshot: Content;
}

export interface NewSessionInput {
  snapshotHash: EntryHashB64;
}
