import type {
  AgentPubKeyB64,
  EntryHashB64,
} from "@holochain-open-dev/core-types";

export interface SendFolkLoreInput {
  sessionHash: EntryHashB64;
  participants: Array<AgentPubKeyB64>;
  data: FolkLore;
}

export type FolkLore =
  | { gone: Array<AgentPubKeyB64> }
  | { participants: Array<AgentPubKeyB64> };
