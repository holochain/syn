export interface SynConfig {
  hearbeatInterval: number;
  requestTimeout: number;
  outOfSessionTimeout: number;
  syncStrategy: SyncStrategy;
  commitStrategy: CommitStrategy;
}

export enum SyncStrategy {
  CRDT,
  BlockOnConflict,
  DropOnConflict,
}

export type CommitStrategy =
  | {
      CommitEveryNMs: number;
    }
  | {
      CommitEveryNDeltas: number;
    };

export function defaultConfig(): SynConfig {
  return {
    hearbeatInterval: 30 * 1000,
    outOfSessionTimeout: 8 * 1000,
    requestTimeout: 1000,
    commitStrategy: { CommitEveryNDeltas: 20 },
    syncStrategy: SyncStrategy.BlockOnConflict,
  };
}
