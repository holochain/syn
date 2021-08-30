import { derived, Readable, writable } from "svelte/store";
import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import type { CellClient } from "@holochain-open-dev/cell-client";
import { serializeHash } from "@holochain-open-dev/core-types";
import { SynClient } from "@syn/zome-client";
import { merge } from "lodash-es";

import type { ApplyDeltaFn } from "./apply-delta";
import { initialState } from "./state/syn-state";
import type { SynState } from "./state/syn-state";
import type { SynWorkspace } from "./internal/workspace";
import { handleSignal } from "./internal/signals";
import { defaultConfig, RecursivePartial, SynConfig } from "./config";
import { initBackgroundTasks } from "./internal/tasks";
import { joinSession } from "./internal/workflows/sessions/folk";
import { buildSessionStore, SessionStore } from "./session-store";
import { newSession } from "./internal/workflows/sessions/scribe";

export function createSynStore<CONTENT, DELTA>(
  cellClient: CellClient,
  initialContent: CONTENT,
  applyDeltaFn: ApplyDeltaFn<CONTENT, DELTA>,
  config?: RecursivePartial<SynConfig>
): SynStore<CONTENT, DELTA> {
  let workspace: SynWorkspace<CONTENT, DELTA> = undefined as any;

  const fullConfig = merge(config, defaultConfig());

  const state: SynState = initialState(serializeHash(cellClient.cellId[1]));

  const store = writable(state);

  const client = new SynClient(cellClient, (signal) =>
    handleSignal(workspace, signal)
  );

  workspace = {
    store,
    applyDeltaFn,
    client,
    initialContent,
    config: fullConfig,
  };

  const { cancel } = initBackgroundTasks(workspace);

  return {
    getAllSessions: () => client.getSessions(),
    joinSession: async (sessionHash) => {
      await joinSession(workspace, sessionHash);
      return buildSessionStore(workspace, sessionHash);
    },
    joinedSessions: derived(workspace.store, (state) =>
      Object.keys(state.joinedSessions)
    ),
    joinedSessionStore: (sessionHash) =>
      buildSessionStore(workspace, sessionHash),
    newSession: async (fromSnapshot?: EntryHashB64) => {
      const sessionHash = await newSession(workspace, fromSnapshot);

      return buildSessionStore(workspace, sessionHash);
    },
    close: async () => {
      client.close();
      cancel();
    },
  };
}

export interface SynStore<CONTENT, DELTA> {
  getAllSessions(): Promise<EntryHashB64[]>;
  joinSession(sessionHash: EntryHashB64): Promise<SessionStore<CONTENT, DELTA>>;
  joinedSessions: Readable<EntryHashB64[]>;
  joinedSessionStore: (
    sessionHash: EntryHashB64
  ) => SessionStore<CONTENT, DELTA>;
  newSession(
    fromSnapshot?: EntryHashB64
  ): Promise<SessionStore<CONTENT, DELTA>>;
  close: () => Promise<void>;
}
