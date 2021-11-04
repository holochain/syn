import type {
  AgentPubKeyB64,
  EntryHashB64,
} from "@holochain-open-dev/core-types";

export interface SendHeartbeatInput {
  sessionHash: EntryHashB64;
  scribe: AgentPubKeyB64;
  data: String;
}

export interface Heartbeat {
  fromFolk: AgentPubKeyB64;
  data: string;
}
