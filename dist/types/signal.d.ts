import type { CommitNotice } from "./commit";
import type { ChangeBundle, ChangeRequest } from "./delta";
import type { FolkLore } from "./folks";
import type { Heartbeat } from "./heartbeat";
import type { RequestSyncInput, StateForSync } from "./sync";
export declare enum SynMessageType {
    SyncReq = "SyncReq",
    SyncResp = "SyncResp",
    ChangeReq = "ChangeReq",
    ChangeNotice = "ChangeNotice",
    CommitNotice = "CommitNotice",
    Heartbeat = "Heartbeat",
    FolkLore = "FolkLore"
}
export declare const allMessageTypes: SynMessageType[];
export declare type SynSignal = {
    sessionHash: string;
    message: SynMessage;
};
export interface MessageBody<TYPE, PAYLOAD> {
    type: TYPE;
    payload: PAYLOAD;
}
export declare type SynMessage = MessageBody<SynMessageType.SyncReq, RequestSyncInput> | MessageBody<SynMessageType.SyncResp, StateForSync> | MessageBody<SynMessageType.ChangeReq, ChangeRequest> | MessageBody<SynMessageType.ChangeNotice, ChangeBundle> | MessageBody<SynMessageType.CommitNotice, CommitNotice> | MessageBody<SynMessageType.Heartbeat, Heartbeat> | MessageBody<SynMessageType.FolkLore, FolkLore>;
