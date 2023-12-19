import {
  AgentPubKey,
  AnyDhtHash,
  decodeHashFromBase64,
  encodeHashToBase64,
  EntryHash,
  HoloHash,
} from '@holochain/client';
import {
  alwaysSubscribed,
  AsyncReadable,
  joinAsync,
  liveLinksStore,
  pipe,
  retryUntilSuccess,
  toPromise,
} from '@holochain-open-dev/stores';
import { EntryRecord, LazyHoloHashMap, slice } from '@holochain-open-dev/utils';
import { Commit, Document } from '@holochain-syn/client';

import { SynStore } from './syn-store.js';
import { WorkspaceStore } from './workspace-store.js';

export class DocumentStore<S, E> {
  constructor(
    public synStore: SynStore,
    public documentHash: AnyDhtHash,
    public documentRecord: EntryRecord<Document>
  ) {}

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
    AsyncReadable<WorkspaceStore<S, E>>
  >((workspaceHash: EntryHash) =>
    alwaysSubscribed(
      retryUntilSuccess(async () => {
        const workspace = await this.synStore.client.getWorkspace(
          workspaceHash
        );
        if (!workspace) throw new Error('Workspace not found yet');
        return new WorkspaceStore<S, E>(this, workspace);
      })
    )
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
    const workspaceRecord = await this.synStore.client.createWorkspace(
      {
        name: workspaceName,
        document_hash: this.documentHash,
      },
      initialTipHash
    );
    return toPromise(this.workspaces.get(workspaceRecord.entryHash));
  }
}

export function uniquify(array: Array<HoloHash>): Array<HoloHash> {
  const strArray = array.map(h => encodeHashToBase64(h));
  const uniqueArray = [...new Set(strArray)];
  return uniqueArray.map(h => decodeHashFromBase64(h));
}
