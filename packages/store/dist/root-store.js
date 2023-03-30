import { derived, get, writable } from 'svelte/store';
import merge from 'lodash-es/merge';
import { EntryHashMap, RecordBag, } from '@holochain-open-dev/utils';
import { defaultConfig } from './config';
import { WorkspaceStore } from './workspace-store';
export class RootStore {
    constructor(client, grammar, root) {
        this.client = client;
        this.grammar = grammar;
        this.root = root;
        /** Public accessors */
        this.knownWorkspaces = writable(new EntryHashMap());
        if (this.root.entry.previous_commit_hashes.length > 0)
            throw new Error('The given commit is not a root commit because it has previous commits');
        this.knownCommits = writable(new RecordBag([root.record]));
    }
    get myPubKey() {
        return this.client.client.myPubKey;
    }
    async fetchWorkspaces() {
        const workspaces = await this.client.getWorkspacesForRoot(this.root.entryHash);
        this.knownWorkspaces.update(w => {
            for (const [entryHash, workspace] of workspaces.entryMap.entries()) {
                w.put(entryHash, workspace);
            }
            return w;
        });
        return derived(this.knownWorkspaces, i => i);
    }
    async fetchCommits() {
        const commits = await this.client.getCommitsForRoot(this.root.entryHash);
        this.knownCommits.set(commits);
        return derived(this.knownCommits, i => i);
    }
    async fetchCommit(commitHash) {
        const knownCommits = get(this.knownCommits);
        if (knownCommits.entryMap.has(commitHash)) {
            return knownCommits.entryMap.get(commitHash);
        }
        const commit = await this.client.getCommit(commitHash);
        if (commit) {
            this.knownCommits.update(c => {
                c.add([commit.record]);
                return c;
            });
        }
        return commit === null || commit === void 0 ? void 0 : commit.entry;
    }
    async joinWorkspace(workspaceHash, config) {
        return WorkspaceStore.joinWorkspace(this, merge(config, defaultConfig()), workspaceHash);
    }
    async createWorkspace(workspaceName, initialTipHash) {
        const workspaceRecord = await this.client.createWorkspace({
            workspace: {
                name: workspaceName,
                initial_commit_hash: initialTipHash,
            },
            root_hash: this.root.entryHash,
        });
        this.knownWorkspaces.update(w => {
            w.put(workspaceRecord.entryHash, workspaceRecord.entry);
            return w;
        });
        return workspaceRecord.entryHash;
    }
}
//# sourceMappingURL=root-store.js.map