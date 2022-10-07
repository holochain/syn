import { derived, Writable, writable } from 'svelte/store';
import { Commit, SynClient } from '@holochain-syn/client';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import { RecordBag } from '@holochain-open-dev/utils';

import type { SynGrammar } from './grammar';
import { RootStore } from './root-store';

export const stateFromCommit = (commit: Commit) => {
  const commitState = decode(commit.state) as Automerge.BinaryDocument;
  const state = Automerge.load(commitState);
  return state;
};

export class SynStore {
  /** Public accessors */
  knownRoots: Writable<RecordBag<Commit>> = writable(new RecordBag());

  constructor(public client: SynClient) {}

  get myPubKey() {
    return this.client.cellClient.cell.cell_id[1];
  }

  async fetchAllRoots() {
    const rootCommits = await this.client.getAllRoots();

    this.knownRoots.set(rootCommits);

    return derived(this.knownRoots, i => i);
  }

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

    this.knownRoots.update(c => {
      c.add([commitRecord.record]);
      return c;
    });

    return new RootStore(this.client, grammar, commitRecord);
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

    this.knownRoots.update(c => {
      c.add([commitRecord.record]);
      return c;
    });

    return new RootStore(this.client, grammar, commitRecord);
  }
}
