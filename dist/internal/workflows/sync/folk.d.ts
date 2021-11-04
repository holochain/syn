import type { StateForSync } from "@syn/zome-client";
import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import type { SynWorkspace } from "../../workspace";
export declare function handleSyncResponse<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, stateForSync: StateForSync): void;
