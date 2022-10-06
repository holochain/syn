import { derived, Writable, writable } from 'svelte/store';
import { Commit, SynClient } from '@holochain-syn/client';
import { decode, encode } from '@msgpack/msgpack';
import { Create } from '@holochain/client';

import type { SynGrammar } from './grammar';
import { EntryHashMap } from '@holochain-open-dev/utils';
import Automerge from 'automerge';
import { RootStore } from './root-store';

export const stateFromCommit = (commit: Commit) => {
  const commitState = decode(commit.state) as Automerge.BinaryDocument;
  const state = Automerge.load(commitState);
  return state;
};

export class SynStore {
  /** Public accessors */
  knownRoots: Writable<EntryHashMap<Commit>> = writable(new EntryHashMap());

  constructor(public client: SynClient) {}

  get myPubKey() {
    return this.client.cellClient.cell.cell_id[1];
  }

  async fetchAllRoots() {
    const rootCommits = await this.client.getAllRoots();

    this.knownRoots.update(c => {
      for (const record of rootCommits) {
        const entryHash = (record.signed_action.hashed.content as Create)
          .entry_hash;
        const commit = decode((record.entry as any).Present.entry) as Commit;
        c.put(entryHash, commit);
      }

      return c;
    });

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

    const record = await this.client.createRoot(commit);
    const entryHash = (record.signed_action.hashed.content as Create)
      .entry_hash;

    this.knownRoots.update(c => {
      c.put(entryHash, commit);
      return c;
    });

    return new RootStore(this.client, grammar, entryHash, commit);
  }

  async createDeterministicRoot<G extends SynGrammar<any, any>>(
    grammar: G,
    meta?: any
  ): Promise<RootStore<G>>  {
    let doc: Automerge.Doc<any> = Automerge.init({
      actorId: 'DETERMINISTIC'
    });

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

    const record = await this.client.createRoot(commit);
    const entryHash = (record.signed_action.hashed.content as Create)
      .entry_hash;

    this.knownRoots.update(c => {
      c.put(entryHash, commit);
      return c;
    });

    return new RootStore(this.client, grammar, entryHash, commit);

  }
}
