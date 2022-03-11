import type { CommitNotice } from './commit';

import type { ChangeNotice, ChangeRequest } from './change';
import type { FolkLore } from './folks';
import type { Heartbeat } from './heartbeat';
import type { RequestSyncInput, StateForSync } from './sync';
import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';

export enum SynMessageType {
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
  SynMessageType.SyncReq,
  SynMessageType.SyncResp,
  SynMessageType.ChangeReq,
  SynMessageType.ChangeNotice,
  SynMessageType.CommitNotice,
  SynMessageType.Heartbeat,
  SynMessageType.FolkLore,
  SynMessageType.SessionClosed,
  SynMessageType.LeaveSessionNotice,
];

export type SynSignal = {
  sessionHash: string;
  message: SynMessage;
};

export interface MessageBody<TYPE, PAYLOAD> {
  type: TYPE;
  payload: PAYLOAD;
}

export type SynMessage =
  | MessageBody<SynMessageType.SyncReq, RequestSyncInput>
  | MessageBody<SynMessageType.SyncResp, StateForSync>
  | MessageBody<SynMessageType.ChangeReq, ChangeRequest>
  | MessageBody<SynMessageType.ChangeNotice, ChangeNotice>
  | MessageBody<SynMessageType.CommitNotice, CommitNotice>
  | MessageBody<SynMessageType.Heartbeat, Heartbeat>
  | MessageBody<SynMessageType.FolkLore, FolkLore>
  | MessageBody<SynMessageType.LeaveSessionNotice, AgentPubKeyB64>
  | MessageBody<SynMessageType.SessionClosed, void>;
