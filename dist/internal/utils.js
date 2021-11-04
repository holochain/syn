export function orderCommits(initialContentHash, commits) {
    let byPreviousContentHash = {};
    for (const [hash, commit] of Object.entries(commits)) {
        byPreviousContentHash[commit.previousContentHash] = hash;
    }
    let orderedCommits = [];
    let contentHash = initialContentHash;
    while (Object.keys(byPreviousContentHash).length > 0) {
        if (!byPreviousContentHash[contentHash])
            throw new Error("We have a corrupted chain of commits");
        orderedCommits.push(byPreviousContentHash[contentHash]);
        byPreviousContentHash[contentHash] = undefined;
        delete byPreviousContentHash[contentHash];
    }
    return orderedCommits;
}
export function applyCommits(initialContent, applyDeltaFn, commits) {
    let content = initialContent;
    for (const commit of commits) {
        content = applyChangeBundle(content, applyDeltaFn, commit.changes);
    }
    return content;
}
export function applyChangeBundle(initialContent, applyDeltaFn, changeBundle) {
    let content = initialContent;
    for (const delta of changeBundle.deltas) {
        content = applyDeltaFn(content, delta);
    }
    return content;
}
//# sourceMappingURL=utils.js.map