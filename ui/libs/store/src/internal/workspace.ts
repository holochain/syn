import type { SynClient } from "@syn/zome-client";
import type { SynState } from "../state/syn-state";
import type { Writable } from "svelte/store";
import type { ApplyDeltaFn } from "../apply-delta";
import type { SynConfig } from "../config";

export interface SynWorkspace<CONTENT, DELTA> {
  client: SynClient;
  store: Writable<SynState>;
  initialContent: CONTENT;
  applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>;
  config: SynConfig;
}
