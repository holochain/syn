export var SynMessageType;
(function (SynMessageType) {
    SynMessageType["SyncReq"] = "SyncReq";
    SynMessageType["SyncResp"] = "SyncResp";
    SynMessageType["ChangeReq"] = "ChangeReq";
    SynMessageType["ChangeNotice"] = "ChangeNotice";
    SynMessageType["CommitNotice"] = "CommitNotice";
    SynMessageType["Heartbeat"] = "Heartbeat";
    SynMessageType["FolkLore"] = "FolkLore";
})(SynMessageType || (SynMessageType = {}));
export const allMessageTypes = [
    SynMessageType.SyncReq,
    SynMessageType.SyncResp,
    SynMessageType.ChangeReq,
    SynMessageType.ChangeNotice,
    SynMessageType.CommitNotice,
    SynMessageType.Heartbeat,
    SynMessageType.FolkLore,
];
//# sourceMappingURL=signal.js.map