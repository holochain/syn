import {
  ActionHash,
  AgentPubKey,
  AnyDhtHash,
  EntryHash,
} from '@holochain/client';
import {
  AsyncReadable,
  joinAsync,
  liveLinksStore,
  pipe,
  retryUntilSuccess,
  uniquify,
} from '@holochain-open-dev/stores';
import {
  EntryRecord,
  GetonlyMap,
  LazyHoloHashMap,
  slice,
} from '@holochain-open-dev/utils';
import { Commit } from '@holochain-syn/client';

import { SynStore } from './syn-store.js';
import { WorkspaceStore } from './workspace-store.js';

export function sliceStrings<K extends string, V>(
  map: GetonlyMap<K, V>,
  keys: K[]
): ReadonlyMap<K, V> {
  const newMap = new Map<K, V>();

  for (const key of keys) {
    newMap.set(key, map.get(key));
  }
  return newMap;
}

export class DocumentStore<S, E> {
  constructor(public synStore: SynStore, public documentHash: AnyDhtHash) {}

  record = retryUntilSuccess(async () => {
    const document = await this.synStore.client.getDocument(this.documentHash);
    if (!document) throw new Error('Document not found yet');
    return document;
  });

  /**
   * Keeps an up to date map of all the workspaces for this document
   */
  allWorkspaces = pipe(
    liveLinksStore(
      this.synStore.client,
      this.documentHash,
      () => this.synStore.client.getWorkspacesForDocument(this.documentHash),
      'DocumentToWorkspaces'
    ),
    links =>
      slice(
        this.workspaces,
        links.map(l => l.target)
      )
  );

  /**
   * Keeps an up to date map of all the commits for this document
   */
  allCommits = pipe(
    liveLinksStore(
      this.synStore.client,
      this.documentHash,

      () => this.synStore.client.getCommitsForDocument(this.documentHash),
      'DocumentToCommits'
    ),
    links => slice(this.commits, uniquify(links.map(l => l.target)))
  );

  /**
   * Lazy map of all the commits in this network
   */
  commits = new LazyHoloHashMap<EntryHash, AsyncReadable<EntryRecord<Commit>>>(
    (commitHash: ActionHash) =>
      retryUntilSuccess(
        async () => {
          const commit = await this.synStore.client.getCommit(commitHash);
          if (!commit) throw new Error('Commit not found yet');
          return commit;
        },
        700,
        100
      )
  );

  /**
   * Lazy map of all the workspaces in this network
   */
  workspaces = new LazyHoloHashMap<EntryHash, WorkspaceStore<S, E>>(
    (workspaceHash: EntryHash) => new WorkspaceStore<S, E>(this, workspaceHash)
  );

  /**
   * Keeps an up to date array of the all the agents that have participated in any commit in this document
   */
  allAuthors = pipe(
    this.allCommits,
    commits => joinAsync(Array.from(commits.values())),
    commits => {
      const agents = commits.map(c => c.entry.authors);
      const agentsFlat = ([] as AgentPubKey[]).concat(...agents);
      return uniquify(agentsFlat);
    }
  );

  async createWorkspace(
    workspaceName: string,
    initialTipHash: EntryHash | undefined
  ): Promise<WorkspaceStore<S, E>> {
    const workspace = await this.synStore.client.createWorkspace(
      {
        name: workspaceName,
        document_hash: this.documentHash,
      },
      initialTipHash
    );
    return this.workspaces.get(workspace.entryHash);
  }
}
