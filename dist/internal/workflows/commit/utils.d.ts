import type { Commit } from "@syn/zome-client";
import type { EntryHashB64, HeaderHashB64 } from "@holochain-open-dev/core-types";
import type { SynState } from "../../../state/syn-state";
export declare function buildCommitFromUncommitted(state: SynState, sessionHash: EntryHashB64, newContentHash: EntryHashB64): Commit;
export declare function putNewCommit(state: SynState, sessionHash: EntryHashB64, newCommitHash: HeaderHashB64, commit: Commit): void;
