import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import type { CommitNotice } from "@syn/zome-client";
import type { SynWorkspace } from "../../workspace";
export declare function handleCommitNotice<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>, sessionHash: EntryHashB64, commitNotice: CommitNotice): void;
