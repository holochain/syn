import type { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import type { SynWorkspace } from "../../workspace";
export declare function notifyGoneFolks<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64): void;
export declare function handleHeartbeat<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, fromFolk: AgentPubKeyB64): void;
