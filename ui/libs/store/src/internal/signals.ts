import { get } from 'svelte/store';
import { SynMessageType, SynSignal } from '@syn/zome-client';

import type { SynWorkspace } from './workspace';
import { handleSyncRequest } from './workflows/sync/scribe';
import { handleSyncResponse } from './workflows/sync/folk';
import { areWeJoiningSession, selectSessionState } from '../state/selectors';
import { handleChangeRequest } from './workflows/change/scribe';
import { handleCommitNotice } from './workflows/commit/folk';
import { handleFolkLore } from './workflows/folklore/folk';
import { handleHeartbeat } from './workflows/folklore/scribe';
import { handleChangeNotice } from './workflows/change/folk';
import type { SynState } from '../state/syn-state';
import { handleSessionClosed } from './workflows/sessions/folk';

function shouldWeHandle(state: SynState, signal: SynSignal): boolean {
  if (selectSessionState(state, signal.sessionHash)) return true;
  if (
    areWeJoiningSession(state, signal.sessionHash) &&
    signal.message.type === SynMessageType.SyncResp
  )
    return true;
  return false;
}

export function handleSignal<CONTENT, DELTA>(
  workspace: SynWorkspace<CONTENT, DELTA>,
  signal: SynSignal
) {
  const currentState = get(workspace.store);

  if (!shouldWeHandle(currentState, signal)) {
    console.warn(`We are getting a signal for a session we don't know about`);
    return;
  }

  switch (signal.message.type) {
    case SynMessageType.SyncReq:
      return handleSyncRequest(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.SyncResp:
      return handleSyncResponse(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.ChangeReq:
      return handleChangeRequest(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.ChangeNotice:
      return handleChangeNotice(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.CommitNotice:
      return handleCommitNotice(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.FolkLore:
      return handleFolkLore(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SynMessageType.Heartbeat:
      return handleHeartbeat(
        workspace,
        signal.sessionHash,
        signal.message.payload.fromFolk
      );
    case SynMessageType.SessionClosed:
      return handleSessionClosed(workspace, signal.sessionHash);
  }
}
