import type { ChangeRequest } from "@syn/zome-client";
import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import type { SynWorkspace } from "../../workspace";
export declare function scribeRequestChange<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, deltas: DELTA[]): void;
export declare function handleChangeRequest<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, changeRequest: ChangeRequest): void;
