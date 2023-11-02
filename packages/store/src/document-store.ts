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
  lazyLoadAndPoll,
  pipe,
  retryUntilSuccess,
  sliceAndJoin,
} from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { Document } from '@holochain-syn/client';

import type { SynGrammar } from './grammar.js';
import { SynStore } from './syn-store.js';

export class DocumentStore<G extends SynGrammar<any, any>> {
  constructor(
    public synStore: SynStore,
    public grammar: G,
    public documentHash: AnyDhtHash
  ) {}

  document: AsyncReadable<EntryRecord<Document>> = retryUntilSuccess(
    async () => {
      const d = await this.synStore.client.getDocument(this.documentHash);
      if (!d) throw new Error('Could not find document');

      return d;
    }
  );

  /**
   * Keeps an up to date array of the entry hashes for all the workspaces for this root
   */
  allWorkspacesHashes = lazyLoadAndPoll(
    () => this.synStore.client.getWorkspacesForDocument(this.documentHash),
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
    () => this.synStore.client.getCommitsForDocument(this.documentHash),
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

  /**
   * Keeps an up to date array of the all the agents that have participated in any commit in this document
   */
  allAuthors = pipe(this.allCommits, commits => {
    const agents = commits.map(c => c.entry.authors);
    const agentsFlat = ([] as AgentPubKey[]).concat(...agents);
    return uniquify(agentsFlat);
  });

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
