import { derived, get, Writable, writable } from 'svelte/store';
import { Commit, SynClient, Workspace } from '@holochain-syn/client';
import { EntryHash } from '@holochain/client';
import merge from 'lodash-es/merge';
import {
  EntryHashMap,
  EntryRecord,
  RecordBag,
} from '@holochain-open-dev/utils';

import { defaultConfig, RecursivePartial, SynConfig } from './config';
import type { SynGrammar } from './grammar';
import { WorkspaceStore } from './workspace-store';

export class RootStore<G extends SynGrammar<any, any>> {
  /** Public accessors */
  knownWorkspaces: Writable<EntryHashMap<Workspace>> = writable(
    new EntryHashMap()
  );
  knownCommits: Writable<RecordBag<Commit>>;

  constructor(
    public client: SynClient,
    public grammar: G,
    public root: EntryRecord<Commit>
  ) {
    if (this.root.entry.previous_commit_hashes.length > 0)
      throw new Error(
        'The given commit is not a root commit because it has previous commits'
      );

    this.knownCommits = writable(new RecordBag([root.record]));
  }

  get myPubKey() {
    return this.client.cellClient.cell.cell_id[1];
  }

  async fetchWorkspaces() {
    const workspaces = await this.client.getWorkspacesForRoot(
      this.root.entryHash
    );

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

  async fetchCommit(commitHash: EntryHash): Promise<Commit | undefined> {
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
    return commit?.entry;
  }

  async joinWorkspace(
    workspaceHash: EntryHash,
    config?: RecursivePartial<SynConfig>
  ): Promise<WorkspaceStore<G>> {
    return WorkspaceStore.joinWorkspace(
      this,
      merge(config, defaultConfig()),
      workspaceHash
    );
  }

  async createWorkspace(
    workspaceName: string,
    initialTipHash: EntryHash
  ): Promise<EntryHash> {
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
