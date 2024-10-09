import {
  ActionHash,
  AnyDhtHash,
  EntryHash,
} from '@holochain/client';
import {
  AsyncReadable,
  immutableEntryStore,
  liveLinksStore,
  pipe,
  uniquify,
} from '@holochain-open-dev/stores';
import {
  EntryRecord,
  GetonlyMap,
  HashType,
  LazyHoloHashMap,
  retype,
  slice,
} from '@holochain-open-dev/utils';
import { Commit } from '@holochain-syn/client';

import { OTSynStore } from './syn-store-ot.js';
import { OTWorkspaceStore } from './workspace-store-ot.js';

export function sliceStringsOT<K extends string, V>(
  map: GetonlyMap<K, V>,
  keys: K[]
): ReadonlyMap<K, V> {
  const newMap = new Map<K, V>();

  for (const key of keys) {
    newMap.set(key, map.get(key));
  }
  return newMap;
}

export class OTDocumentStore<S, E> {
  constructor(public synStore: OTSynStore, public documentHash: AnyDhtHash) { }

  record = immutableEntryStore(async () => this.synStore.client.getDocument(this.documentHash));

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
  commits = new LazyHoloHashMap<ActionHash, AsyncReadable<EntryRecord<Commit>>>(
    (commitHash: ActionHash) =>
      immutableEntryStore(
        async () => this.synStore.client.getCommit(commitHash),
        1000,
        10
      )
  );

  /**
   * Lazy map of all the workspaces in this network
   */
  workspaces = new LazyHoloHashMap<EntryHash, OTWorkspaceStore<S, E>>(
    (workspaceHash: EntryHash) => new OTWorkspaceStore<S, E>(this, workspaceHash)
  );

  /**
   * Keeps an up to date array of the all the agents that have participated in any commit in this document
   */
  allAuthors = pipe(
    liveLinksStore(
      this.synStore.client,
      this.documentHash,
      () => this.synStore.client.getAuthorsForDocument(this.documentHash),
      'DocumentToAuthors'
    ),
    links => uniquify(links.map(l => retype(l.target, HashType.AGENT)))
  );


  async createWorkspace(
    workspaceName: string,
    initialTipHash: EntryHash | undefined
  ): Promise<OTWorkspaceStore<S, E>> {
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
