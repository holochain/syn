export interface SynConfig {
    hearbeatInterval: number;
    requestTimeout: number;
    outOfSessionTimeout: number;
    syncStrategy: SyncStrategy;
    commitStrategy: CommitStrategy;
}
export declare enum SyncStrategy {
    CRDT = 0,
    BlockOnConflict = 1,
    DropOnConflict = 2
}
export interface CommitStrategy {
    CommitEveryNMs: number | undefined;
    CommitEveryNDeltas: number | undefined;
}
export declare function defaultConfig(): SynConfig;
export declare type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object ? RecursivePartial<T[P]> : T[P];
};
