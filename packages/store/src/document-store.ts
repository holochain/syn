import {
  AgentPubKey,
  AnyDhtHash,
  decodeHashFromBase64,
  encodeHashToBase64,
  EntryHash,
  HoloHash,
} from '@holochain/client';
import {
  AsyncReadable,
  joinAsync,
  liveLinksStore,
  pipe,
  retryUntilSuccess,
} from '@holochain-open-dev/stores';
import { EntryRecord, LazyHoloHashMap, slice } from '@holochain-open-dev/utils';
import { Commit, Document, Workspace } from '@holochain-syn/client';

import type { SynGrammar } from './grammar.js';
import { SynStore } from './syn-store.js';

export class DocumentStore<G extends SynGrammar<any, any>> {
  constructor(
    public synStore: SynStore,
    public grammar: G,
    public documentHash: AnyDhtHash
  ) {}

  document: AsyncReadable<EntryRecord<Document>> = this.synStore.documents.get(
    this.documentHash
  );

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
    links => slice(this.workspaces, uniquify(links.map(l => l.target)))
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
    (commitHash: EntryHash) =>
      retryUntilSuccess(async () => {
        const commit = await this.synStore.client.getCommit(commitHash);
        if (!commit) throw new Error('Commit not found yet');
        return commit;
      })
  );

  /**
   * Lazy map of all the workspaces in this network
   */
  workspaces = new LazyHoloHashMap<
    EntryHash,
    AsyncReadable<EntryRecord<Workspace>>
  >((workspaceHash: EntryHash) =>
    retryUntilSuccess(async () => {
      const workspace = await this.synStore.client.getWorkspace(workspaceHash);
      if (!workspace) throw new Error('Workspace not found yet');
      return workspace;
    })
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
    initialTipHash: EntryHash
  ): Promise<EntryHash> {
    const workspaceRecord = await this.synStore.client.createWorkspace(
      {
        name: workspaceName,
        document_hash: this.documentHash,
      },
      initialTipHash
    );
    return workspaceRecord.entryHash;
  }
}

export function uniquify(array: Array<HoloHash>): Array<HoloHash> {
  const strArray = array.map(h => encodeHashToBase64(h));
  const uniqueArray = [...new Set(strArray)];
  return uniqueArray.map(h => decodeHashFromBase64(h));
}
