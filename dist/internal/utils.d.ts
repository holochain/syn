import type { Dictionary, EntryHashB64, HeaderHashB64 } from "@holochain-open-dev/core-types";
import type { ChangeBundle, Commit } from "@syn/zome-client";
import type { ApplyDeltaFn } from "../apply-delta";
export declare function orderCommits(initialContentHash: EntryHashB64, commits: Dictionary<Commit>): Array<HeaderHashB64>;
export declare function applyCommits<CONTENT, DELTA>(initialContent: CONTENT, applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>, commits: Array<Commit>): CONTENT;
export declare function applyChangeBundle<CONTENT, DELTA>(initialContent: CONTENT, applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>, changeBundle: ChangeBundle): CONTENT;
