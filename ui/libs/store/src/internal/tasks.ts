import { get } from "svelte/store";
import { amIScribe } from "../state/selectors";
import { checkRequestedChanges } from "./workflows/change/folk";
import { commitChanges } from "./workflows/commit/scribe";

import { heartbeat } from "./workflows/folklore";
import type { SynWorkspace } from "./workspace";

export function initBackgroundTasks<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>
) {
  const intervals: any[] = [];

  const heartbeatInterval = setInterval(() => {
    const state = get(workspace.store);
    for (const sessionHash of Object.keys(state.joinedSessions)) {
      heartbeat(workspace, sessionHash);
    }
  }, workspace.config.hearbeatInterval);
  intervals.push(heartbeatInterval);

  const checkRequestInterval = setInterval(() => {
    const state = get(workspace.store);
    for (const sessionHash of Object.keys(state.joinedSessions)) {
      checkRequestedChanges(workspace, sessionHash);
    }
  }, workspace.config.requestTimeout / 2);
  intervals.push(checkRequestInterval);

  if (
    (workspace.config.commitStrategy as { CommitEveryNMs: number })
      .CommitEveryNMs
  ) {
    const commitInterval = setInterval(() => {
      const state = get(workspace.store);
      for (const sessionHash of Object.keys(state.joinedSessions)) {
        if (amIScribe(state, sessionHash)) {
          commitChanges(workspace, sessionHash);
        }
      }
    }, (workspace.config.commitStrategy as { CommitEveryNMs: number }).CommitEveryNMs);
    intervals.push(commitInterval);
  }

  return {
    cancel: () => intervals.forEach((i) => clearInterval(i)),
  };
}
