import { derived, writable } from 'svelte/store';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import { RecordBag } from '@holochain-open-dev/utils';
import { RootStore } from './root-store';
export const stateFromCommit = (commit) => {
    const commitState = decode(commit.state);
    const state = Automerge.load(commitState);
    return state;
};
export class SynStore {
    constructor(client) {
        this.client = client;
        /** Public accessors */
        this.knownRoots = writable(new RecordBag());
    }
    get myPubKey() {
        return this.client.client.myPubKey;
    }
    async fetchAllRoots() {
        const rootCommits = await this.client.getAllRoots();
        this.knownRoots.set(rootCommits);
        return derived(this.knownRoots, i => i);
    }
    async createRoot(grammar, meta) {
        let doc = Automerge.init();
        doc = Automerge.change(doc, d => grammar.initState(d));
        if (meta) {
            meta = encode(meta);
        }
        const commit = {
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
    async createDeterministicRoot(grammar, meta) {
        let doc = Automerge.init({
            actorId: 'aa',
        });
        doc = Automerge.change(doc, { time: 0 }, d => grammar.initState(d));
        if (meta) {
            meta = encode(meta);
        }
        const commit = {
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
//# sourceMappingURL=syn-store.js.map