import { EntryHash } from '@holochain/client';
import {
  lazyLoadAndPoll,
  pipe,
  sliceAndJoin,
} from '@holochain-open-dev/stores';

import type { SynGrammar } from './grammar.js';
import { SynStore } from './syn-store.js';

export class DocumentStore<G extends SynGrammar<any, any>> {
  constructor(
    public synStore: SynStore,
    public grammar: G,
    public rootHash: EntryHash
  ) {}

  /**
   * Keeps an up to date array of the entry hashes for all the workspaces for this root
   */
  allWorkspacesHashes = lazyLoadAndPoll(
    () => this.synStore.client.getWorkspacesForRoot(this.rootHash),
    4000
  );

  /**
   * Keeps an up to date map of all the workspaces for this root
   */
  allWorkspaces = pipe(
    this.allWorkspacesHashes,
    hashes => sliceAndJoin(this.synStore.workspaces, hashes),
    workspaces => Array.from(workspaces.values())
  );

  /**
   * Keeps an up to date array of the entry hashes for all the commits for this root
   */
  allCommitsHashes = lazyLoadAndPoll(
    () => this.synStore.client.getCommitsForRoot(this.rootHash),
    4000
  );

  /**
   * Keeps an up to date map of all the commits for this root
   */
  allCommits = pipe(
    this.allCommitsHashes,
    hashes => sliceAndJoin(this.synStore.commits, hashes),
    commits => Array.from(commits.values())
  );

  async createWorkspace(
    workspaceName: string,
    initialTipHash: EntryHash
  ): Promise<EntryHash> {
    const workspaceRecord = await this.synStore.client.createWorkspace({
      workspace: {
        name: workspaceName,
        root_hash: this.rootHash,
      },
      initial_commit_hash: initialTipHash,
    });

    return workspaceRecord.entryHash;
  }
}
