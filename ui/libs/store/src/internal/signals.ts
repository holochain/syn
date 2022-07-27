import { get } from 'svelte/store';
import { SessionMessageType, SynSignal } from '@holochain-syn/client';

import type { SynWorkspace } from './workspace';
import { handleSyncResponse, handleSyncRequest } from './workflows/sync';
import { areWeJoiningSession, selectSessionState } from '../state/selectors';
import { handleChangeRequest } from './workflows/change/scribe';
import { handleCommitNotice } from './workflows/commit/folk';
import { handleFolkLore } from './workflows/folklore/folk';
import { handleHeartbeat } from './workflows/folklore/scribe';
import { handleChangeNotice } from './workflows/change/folk';
import type { SynState } from '../state/syn-state';
import { handleSessionClosed } from './workflows/sessions/folk';
import { handleLeaveSessionNotice } from './workflows/sessions/scribe';
import type { SynGrammar } from '../grammar';

function shouldWeHandle<G extends SynGrammar<any, any>>(
  state: SynState<G>,
  signal: SynSignal
): boolean {
  if (selectSessionState(state, signal.sessionHash)) return true;
  if (
    areWeJoiningSession(state, signal.sessionHash) &&
    signal.message.type === SessionMessageType.SyncResp
  )
    return true;
  return false;
}

export function handleSignal<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  signal: SynSignal
) {
  const currentState = get(workspace.store);

  if (!shouldWeHandle(currentState, signal)) {
    console.warn(`We are getting a signal for a session we don't know about`);
    return;
  }

  switch (signal.message.type) {
    case SessionMessageType.SyncReq:
      return handleSyncRequest(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SessionMessageType.SyncResp:
      return handleSyncResponse(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SessionMessageType.ChangeReq:
      return handleChangeRequest(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SessionMessageType.ChangeNotice:
      return handleChangeNotice(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SessionMessageType.CommitNotice:
      return handleCommitNotice(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SessionMessageType.FolkLore:
      return handleFolkLore(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
    case SessionMessageType.Heartbeat:
      return handleHeartbeat(
        workspace,
        signal.sessionHash,
        signal.message.payload.fromFolk
      );
    case SessionMessageType.SessionClosed:
      return handleSessionClosed(workspace, signal.sessionHash);
    case SessionMessageType.LeaveSessionNotice:
      return handleLeaveSessionNotice(
        workspace,
        signal.sessionHash,
        signal.message.payload
      );
  }
}
