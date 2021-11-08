import type { CommitNotice } from './commit';

import type { ChangeNotice, ChangeRequest } from './change';
import type { FolkLore } from './folks';
import type { Heartbeat } from './heartbeat';
import type { RequestSyncInput, StateForSync } from './sync';

export enum SynMessageType {
  SyncReq = 'SyncReq',
  SyncResp = 'SyncResp',
  ChangeReq = 'ChangeReq',
  ChangeNotice = 'ChangeNotice',
  CommitNotice = 'CommitNotice',
  Heartbeat = 'Heartbeat',
  FolkLore = 'FolkLore',
}

export const allMessageTypes = [
  SynMessageType.SyncReq,
  SynMessageType.SyncResp,
  SynMessageType.ChangeReq,
  SynMessageType.ChangeNotice,
  SynMessageType.CommitNotice,
  SynMessageType.Heartbeat,
  SynMessageType.FolkLore,
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
  | MessageBody<SynMessageType.FolkLore, FolkLore>;
