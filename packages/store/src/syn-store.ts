import {
  AsyncReadable,
  liveLinksStore,
  pipe,
  retryUntilSuccess,
  uniquify,
} from '@holochain-open-dev/stores';
import { Commit, SynClient, Document } from '@holochain-syn/client';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import {
  EntryRecord,
  LazyHoloHashMap,
  LazyMap,
  hashEntry,
  slice,
  encodeAppEntry,
} from '@holochain-open-dev/utils';
import { AnyDhtHash, EntryHash } from '@holochain/client';

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
  documentsByTag = new LazyMap((tag: string) =>
    pipe(
      liveLinksStore(
        this.client,
        hashEntry(encodeAppEntry(`document_tags.${tag}`)),
        () => this.client.getDocumentsWithTag(tag),
        'TagToDocument'
      ),
      links => slice(this.documents, uniquify(links.map(l => l.target)))
    )
  );

  /**
   * Lazy map of all the documents in this network
   */
  documents = new LazyHoloHashMap<
    EntryHash,
    AsyncReadable<EntryRecord<Document>>
  >((documentHash: AnyDhtHash) =>
    retryUntilSuccess(async () => {
      const commit = await this.client.getDocument(documentHash);
      if (!commit) throw new Error('Document not found yet');
      return commit;
    })
  );

  async createDocument<G extends SynGrammar<any, any>>(grammar: G, meta?: any) {
    let doc: Automerge.Doc<any> = Automerge.init();

    doc = Automerge.change(doc, d => grammar.initState(d));

    const documentRecord = await this.client.createDocument({
      meta: meta ? encode(meta) : undefined,
    });

    const commit = await this.client.createCommit({
      authors: [],
      document_hash: documentRecord.actionHash,
      meta: undefined,
      previous_commit_hashes: [],
      state: encode(Automerge.save(doc)),
      witnesses: [],
    });

    return {
      documentHash: documentRecord.actionHash,
      firstCommitHash: commit.entryHash,
    };
  }

  async createDeterministicDocument<G extends SynGrammar<any, any>>(
    grammar: G,
    meta?: any
  ) {
    let doc: Automerge.Doc<any> = Automerge.init({
      actorId: 'aa',
    });

    doc = Automerge.change(doc, { time: 0 }, d => grammar.initState(d));

    const documentRecord = await this.client.createDocument({
      meta: meta ? encode(meta) : undefined,
    });

    const commit = await this.client.createCommit({
      authors: [],
      document_hash: documentRecord.entryHash,
      meta: undefined,
      previous_commit_hashes: [],
      state: encode(Automerge.save(doc)),
      witnesses: [],
    });

    return {
      documentHash: documentRecord.entryHash,
      firstCommitHash: commit.entryHash,
    };
  }
}
