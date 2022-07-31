import type { CommitNotice } from './commit';

import type { ChangeNotice, ChangeRequest } from './change';
import type { FolkLore } from './folks';
import type { Heartbeat } from './heartbeat';
import type { RequestSyncInput } from './sync';
import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { BinarySyncMessage } from 'automerge';

export enum SessionMessageType {
  SyncReq = 'SyncReq',
  SyncResp = 'SyncResp',
  ChangeReq = 'ChangeReq',
  ChangeNotice = 'ChangeNotice',
  CommitNotice = 'CommitNotice',
  Heartbeat = 'Heartbeat',
  FolkLore = 'FolkLore',
  SessionClosed = 'SessionClosed',
  LeaveSessionNotice = 'LeaveSessionNotice',
}

export const allMessageTypes = [
  SessionMessageType.SyncReq,
  SessionMessageType.SyncResp,
  SessionMessageType.ChangeReq,
  SessionMessageType.ChangeNotice,
  SessionMessageType.CommitNotice,
  SessionMessageType.Heartbeat,
  SessionMessageType.FolkLore,
  SessionMessageType.SessionClosed,
  SessionMessageType.LeaveSessionNotice,
];

export type SynSignal = {
  sessionHash: string;
  message: SessionMessage;
};

export interface MessageBody<TYPE, PAYLOAD> {
  type: TYPE;
  payload: PAYLOAD;
}

export type SessionMessage =
  | MessageBody<SessionMessageType.SyncReq, RequestSyncInput>
  | MessageBody<SessionMessageType.SyncResp, BinarySyncMessage>
  | MessageBody<SessionMessageType.ChangeReq, ChangeRequest>
  | MessageBody<SessionMessageType.ChangeNotice, ChangeNotice>
  | MessageBody<SessionMessageType.CommitNotice, CommitNotice>
  | MessageBody<SessionMessageType.Heartbeat, Heartbeat>
  | MessageBody<SessionMessageType.FolkLore, FolkLore>
  | MessageBody<SessionMessageType.LeaveSessionNotice, AgentPubKeyB64>
  | MessageBody<SessionMessageType.SessionClosed, void>;
