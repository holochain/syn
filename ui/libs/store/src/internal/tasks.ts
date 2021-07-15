import { get } from "svelte/store";
import { amIScribe } from "../state/selectors";
import { checkRequestedChanges } from "./workflows/change/folk";
import { commitChanges } from "./workflows/commit/scribe";

import { heartbeat } from "./workflows/heartbeat";
import type { SynWorkspace } from "./workspace";

export function initBackgroundTasks<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>
) {
  setInterval(() => {
    const state = get(workspace.store);
    for (const sessionHash of Object.keys(state.joinedSessions)) {
      heartbeat(workspace, sessionHash);
    }
  }, workspace.config.hearbeatInterval);

  setInterval(() => {
    const state = get(workspace.store);
    for (const sessionHash of Object.keys(state.joinedSessions)) {
      checkRequestedChanges(workspace, sessionHash);
    }
  }, workspace.config.requestTimeout / 2);

  if (
    (workspace.config.commitStrategy as { CommitEveryNMs: number })
      .CommitEveryNMs
  ) {
    setInterval(() => {
      const state = get(workspace.store);
      for (const sessionHash of Object.keys(state.joinedSessions)) {
        if (amIScribe(state, sessionHash)) {
          commitChanges(workspace, sessionHash);
        }
      }
    }, (workspace.config.commitStrategy as { CommitEveryNMs: number }).CommitEveryNMs);
  }
}
