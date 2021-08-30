import type {
  AgentPubKeyB64,
  EntryHashB64,
  HeaderHashB64,
} from "@holochain-open-dev/core-types";
import type { ChangeBundle } from "./delta";

export interface CommitInput {
  sessionHash: EntryHashB64;
  sessionSnapshot: EntryHashB64;

  commit: Commit;

  participants: AgentPubKeyB64[];
}

export interface Commit {
  changes: ChangeBundle;

  createdAt: number;

  previousCommitHashes: Array<HeaderHashB64>;

  previousContentHash: EntryHashB64;
  newContentHash: EntryHashB64;
  meta: ChangeMeta;
}

export interface CommitNotice {
  commitHash: HeaderHashB64;
  committedDeltasCount: number;
  previousContentHash: EntryHashB64;
  newContentHash: EntryHashB64;
  meta: ChangeMeta;
}

export interface ChangeMeta {
  witnesses: AgentPubKeyB64[];
  appSpecific: Content;
}

export type Content = any;
