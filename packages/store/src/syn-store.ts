import {
  lazyLoadAndPoll,
  pipe,
  retryUntilSuccess,
  sliceAndJoin,
} from '@holochain-open-dev/stores';
import { Commit, SynClient } from '@holochain-syn/client';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import { LazyHoloHashMap } from '@holochain-open-dev/utils';
import { EntryHash } from '@holochain/client';

import type { SynGrammar } from './grammar.js';

export const stateFromCommit = (commit: Commit) => {
  const commitState = decode(commit.state) as Automerge.BinaryDocument;
  const state = Automerge.load(commitState);
  return state;
};

export class SynStore {
  /** Public accessors */

  constructor(public client: SynClient) {}

  /**
   * Keeps an up to date array of the entry hashes for all the roots in this network
   */
  allRootsHashes = lazyLoadAndPoll(async () => this.client.getAllRoots(), 3000);

  /**
   * Keeps an up to date map of all the roots in this network
   */
  allRoots = pipe(
    this.allRootsHashes,
    hashes => sliceAndJoin(this.commits, hashes),
    map => Array.from(map.values())
  );

  /**
   * Lazy map of all the roots in this network
   */
  commits = new LazyHoloHashMap((commitHash: EntryHash) =>
    retryUntilSuccess(async () => {
      const commit = await this.client.getCommit(commitHash);
      if (!commit) throw new Error('Commit not found yet');
      return commit;
    })
  );

  /**
   * Lazy map of all the workspaces in this network
   */
  workspaces = new LazyHoloHashMap((workspaceHash: EntryHash) =>
    retryUntilSuccess(async () => {
      const workspace = await this.client.getWorkspace(workspaceHash);
      if (!workspace) throw new Error('Workspace not found yet');
      return workspace;
    })
  );

  async createDocument<G extends SynGrammar<any, any>>(
    grammar: G,
    meta?: any
  ): Promise<EntryHash> {
    let doc: Automerge.Doc<any> = Automerge.init();

    doc = Automerge.change(doc, d => grammar.initState(d));

    if (meta) {
      meta = encode(meta);
    }

    const commit: Commit = {
      state: encode(Automerge.save(doc)),
      authors: [],
      meta,
      previous_commit_hashes: [],
      witnesses: [],
    };

    const commitRecord = await this.client.createRoot(commit);

    return commitRecord.entryHash;
  }

  async createDeterministicDocument<G extends SynGrammar<any, any>>(
    grammar: G,
    meta?: any
  ): Promise<EntryHash> {
    let doc: Automerge.Doc<any> = Automerge.init({
      actorId: 'aa',
    });

    doc = Automerge.change(doc, { time: 0 }, d => grammar.initState(d));

    if (meta) {
      meta = encode(meta);
    }
    const commit: Commit = {
      state: encode(Automerge.save(doc)),
      authors: [],
      meta,
      previous_commit_hashes: [],
      witnesses: [],
    };

    const commitRecord = await this.client.createRoot(commit);

    return commitRecord.entryHash;
  }
}
