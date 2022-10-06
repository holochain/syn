import { derived, Writable, writable } from 'svelte/store';
import { Commit, SynClient, Workspace } from '@holochain-syn/client';
import { decode } from '@msgpack/msgpack';
import { Create, EntryHash } from '@holochain/client';
import merge from 'lodash-es/merge';

import { defaultConfig, RecursivePartial, SynConfig } from './config';
import type { SynGrammar } from './grammar';
import { EntryHashMap } from '@holochain-open-dev/utils';
import { WorkspaceStore } from './workspace-store';

export class DocumentStore<G extends SynGrammar<any, any>> {
  /** Public accessors */
  knownWorkspaces: Writable<EntryHashMap<Workspace>> = writable(
    new EntryHashMap()
  );
  knownCommits: Writable<EntryHashMap<Commit>>;

  constructor(
    public client: SynClient,
    public grammar: G,
    public documentRootHash: EntryHash,
    public documentRoot: Commit
  ) {
    this.knownCommits = writable(
      new EntryHashMap([[documentRootHash, documentRoot]])
    );
  }

  get myPubKey() {
    return this.client.cellClient.cell.cell_id[1];
  }

  async fetchWorkspaces() {
    const workspaces = await this.client.getWorkspacesForRoot(
      this.documentRootHash
    );

    this.knownWorkspaces.update(w => {
      for (const record of workspaces) {
        const entryHash = (record.signed_action.hashed.content as Create)
          .entry_hash;
        const workspace = decode(
          (record.entry as any).Present.entry
        ) as Workspace;
        w.put(entryHash, workspace);
      }

      return w;
    });

    return derived(this.knownWorkspaces, i => i);
  }

  async fetchCommits() {
    const commits = await this.client.getCommitsForRoot(this.documentRootHash);

    this.knownCommits.update(c => {
      for (const record of commits) {
        const entryHash = (record.signed_action.hashed.content as Create)
          .entry_hash;
        const commit = decode((record.entry as any).Present.entry) as Commit;
        c.put(entryHash, commit);
      }

      return c;
    });

    return derived(this.knownCommits, i => i);
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
        root_hash: this.documentRootHash,
      },
      initial_tip_hash: initialTipHash,
    });
    const entryHash = (workspaceRecord.signed_action.hashed.content as Create)
      .entry_hash;
    this.knownWorkspaces.update(w => {
      const workspace = decode(
        (workspaceRecord.entry as any).Present.entry
      ) as Workspace;
      w.put(entryHash, workspace);

      return w;
    });

    return entryHash;
  }
}
