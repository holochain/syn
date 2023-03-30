export interface SynConfig {
    hearbeatInterval: number;
    outOfSessionTimeout: number;
    commitStrategy: CommitStrategy;
}
export interface CommitStrategy {
    CommitEveryNMs: number | undefined;
    CommitEveryNDeltas: number | undefined;
}
export declare function defaultConfig(): SynConfig;
export declare type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object ? RecursivePartial<T[P]> : T[P];
};
