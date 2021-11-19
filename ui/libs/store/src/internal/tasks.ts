import { get } from 'svelte/store';
import type { SynGrammar } from '../grammar';
import { checkRequestedChanges, requestChanges } from './workflows/change/folk';
import { notifyChanges } from './workflows/change/scribe';
/* import { amIScribe, selectLastCommitTime } from '../state/selectors';
import { commitChanges } from './workflows/commit/scribe';
 */
import { heartbeat } from './workflows/folklore';
import type { SynWorkspace } from './workspace';

export function initBackgroundTasks<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>
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

  const requestChangesInterval = setInterval(() => {
    const state = get(workspace.store);
    for (const sessionHash of Object.keys(state.joinedSessions)) {
      requestChanges(workspace, sessionHash);
    }
  }, workspace.config.debounceInterval);
  intervals.push(requestChangesInterval);

  const notifyChangesInterval = setInterval(() => {
    const state = get(workspace.store);
    for (const sessionHash of Object.keys(state.joinedSessions)) {
      notifyChanges(workspace, sessionHash);
    }
  }, workspace.config.debounceInterval);
  intervals.push(notifyChangesInterval);
/* 
  const CommitEveryNMs: number | undefined = (
    workspace.config.commitStrategy as { CommitEveryNMs: number }
  ).CommitEveryNMs;
  if (CommitEveryNMs) {
    const commitInterval = setInterval(() => {
      const state = get(workspace.store);
      for (const sessionHash of Object.keys(state.joinedSessions)) {
        const latestCommitTime = selectLastCommitTime(state, sessionHash);
        if (
          amIScribe(state, sessionHash) &&
          Date.now() - latestCommitTime > CommitEveryNMs
        ) {
          commitChanges(workspace, sessionHash);
        }
      }
    }, CommitEveryNMs / 10);
    intervals.push(commitInterval);
  } */

  return {
    cancel: () => intervals.forEach(i => clearInterval(i)),
  };
}
