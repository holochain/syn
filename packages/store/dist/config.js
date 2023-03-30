export function defaultConfig() {
    return {
        hearbeatInterval: 5 * 1000,
        outOfSessionTimeout: 15 * 1000,
        commitStrategy: { CommitEveryNDeltas: 30, CommitEveryNMs: 1000 * 10 }, // TODO: reduce ms
    };
}
//# sourceMappingURL=config.js.map