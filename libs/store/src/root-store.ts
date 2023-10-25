import { Commit } from '@holochain-syn/client';
import { EntryHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { lazyLoadAndPoll } from '@holochain-open-dev/stores';

import { defaultConfig, RecursivePartial, SynConfig } from './config.js';
import type { SynGrammar } from './grammar.js';
import { WorkspaceStore } from './workspace-store.js';
import { SynStore } from './syn-store.js';

export class RootStore<G extends SynGrammar<any, any>> {
  constructor(
    public synStore: SynStore,
    public grammar: G,
    public root: EntryRecord<Commit>
  ) {
    if (this.root.entry.previous_commit_hashes.length > 0)
      throw new Error(
        'The given commit is not a root commit because it has previous commits'
      );
  }

  allWorkspaces = lazyLoadAndPoll(
    () => this.synStore.client.getWorkspacesForRoot(this.root.entryHash),
    4000
  );
  allCommits = lazyLoadAndPoll(
    () => this.synStore.client.getCommitsForRoot(this.root.entryHash),
    4000
  );

  async createWorkspace(
    workspaceName: string,
    initialTipHash: EntryHash
  ): Promise<EntryHash> {
    const workspaceRecord = await this.synStore.client.createWorkspace({
      workspace: {
        name: workspaceName,
        initial_commit_hash: initialTipHash,
      },
      root_hash: this.root.entryHash,
    });

    return workspaceRecord.entryHash;
  }
}
