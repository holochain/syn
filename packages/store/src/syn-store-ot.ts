import {
  liveLinksStore,
  pipe,
  retryUntilSuccess,
  uniquify,
} from '@holochain-open-dev/stores';
import { Commit, Document, SynClient } from '@holochain-syn/client';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import { LazyHoloHashMap, LazyMap, slice } from '@holochain-open-dev/utils';
import { AnyDhtHash, EntryHash } from '@holochain/client';

import { OTDocumentStore } from './document-store-ot.js';

export const stateFromCommitOT = (commit: Commit) => {
  const commitState = decode(commit.state) as Automerge.BinaryDocument;
  const state = Automerge.load(commitState);
  return state;
};

export const stateFromDocumentOT = (document: Document) => {
  const documentInitialState = decode(
    document.initial_state
  ) as Automerge.BinaryDocument;
  const state = Automerge.load(documentInitialState);
  return state;
};

export class OTSynStore {
  /** Public accessors */

  constructor(
    public client: SynClient, 
    // public opsTransformFunction: (ops1: any[], ops2: any[]) => any[]
  ) {}

  /**
   * Keeps an up to date array of the entry hashes for all the roots in this network
   */
  documentsByTag = new LazyMap((tag: string) =>
    pipe(
      this.tagsEntryHash.get(tag),
      tagPathEntryHash =>
        liveLinksStore(
          this.client,
          tagPathEntryHash,
          () => this.client.getDocumentsWithTag(tag),
          'TagToDocument'
        ),
      links => slice(this.documents, uniquify(links.map(l => l.target)))
    )
  );

  private tagsEntryHash = new LazyMap((tag: string) =>
    retryUntilSuccess(() => this.client.tagPathEntryHash(tag))
  );

  /**
   * Lazy map of all the documents in this network
   */
  documents = new LazyHoloHashMap<EntryHash, OTDocumentStore<any, any>>(
    (documentHash: AnyDhtHash) =>
      new OTDocumentStore<any, any>(this, documentHash)
  );

  async createDocument<S>(initialState: S, meta?: any) {
    // let doc = ''
    // const documentRecord = await this.client.createDocument({
    //   meta: meta ? encode(meta) : undefined,
    //   initial_state: encode(doc),
    // });

    // return this.documents.get(documentRecord.entryHash);
    let doc: Automerge.Doc<any> = Automerge.from(initialState);
    
    const documentRecord = await this.client.createDocument({
      meta: meta ? encode(meta) : undefined,
      initial_state: encode(Automerge.save(doc)),
    });
    
    return this.documents.get(documentRecord.actionHash);
  }

  async createDeterministicDocument<S>(initialState: S, meta?: any) {
    let doc: Automerge.Doc<any> = Automerge.init({
      actorId: 'aa',
    });

    doc = Automerge.change(doc, { time: 0 }, d =>
      Object.assign(d, initialState)
    );

    const documentRecord = await this.client.createDocument({
      meta: meta ? encode(meta) : undefined,
      initial_state: encode(Automerge.save(doc)),
    });

    return this.documents.get(documentRecord.entryHash);
  }
}
