import { lazyLoadAndPoll, retryUntilSuccess } from '@holochain-open-dev/stores';
import { Commit, SynClient } from '@holochain-syn/client';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import { LazyHoloHashMap } from '@holochain-open-dev/utils';
import { EntryHash } from '@holochain/client';

import type { SynGrammar } from './grammar.js';
import { RootStore } from './root-store.js';

export const stateFromCommit = (commit: Commit) => {
  const commitState = decode(commit.state) as Automerge.BinaryDocument;
  const state = Automerge.load(commitState);
  return state;
};

export class SynStore {
  /** Public accessors */

  constructor(public client: SynClient) {}

  allRoots = lazyLoadAndPoll(async () => this.client.getAllRoots(), 3000);

  commits = new LazyHoloHashMap((rootHash: EntryHash) =>
    retryUntilSuccess(async () => {
      const commit = await this.client.getCommit(rootHash);
      if (!commit) throw new Error('Commit not found yet');
      return commit;
    })
  );

  async createRoot<G extends SynGrammar<any, any>>(
    grammar: G,
    meta?: any
  ): Promise<RootStore<G>> {
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

    return new RootStore(this, grammar, commitRecord);
  }

  async createDeterministicRoot<G extends SynGrammar<any, any>>(
    grammar: G,
    meta?: any
  ): Promise<RootStore<G>> {
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

    return new RootStore(this, grammar, commitRecord);
  }
}
