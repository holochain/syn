export var SyncStrategy;
(function (SyncStrategy) {
    SyncStrategy[SyncStrategy["CRDT"] = 0] = "CRDT";
    SyncStrategy[SyncStrategy["BlockOnConflict"] = 1] = "BlockOnConflict";
    SyncStrategy[SyncStrategy["DropOnConflict"] = 2] = "DropOnConflict";
})(SyncStrategy || (SyncStrategy = {}));
export function defaultConfig() {
    return {
        hearbeatInterval: 30 * 1000,
        outOfSessionTimeout: 8 * 1000,
        requestTimeout: 1000,
        commitStrategy: { CommitEveryNDeltas: 20000, CommitEveryNMs: 2 * 100000 * 60 },
        syncStrategy: SyncStrategy.BlockOnConflict,
    };
}
//# sourceMappingURL=config.js.map