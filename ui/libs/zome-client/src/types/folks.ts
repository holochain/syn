import type {
  AgentPubKeyB64,
  Dictionary,
  EntryHashB64,
} from '@holochain-open-dev/core-types';

export interface SendFolkLoreInput {
  sessionHash: EntryHashB64;
  participants: Array<AgentPubKeyB64>;
  folkLore: FolkLore;
}

export interface FolkInfo {
  lastSeen: number;
}

export type FolkLore = Dictionary<FolkInfo>;
