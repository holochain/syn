import { encode, decode } from '@msgpack/msgpack';
import { isEqual } from 'lodash-es';
import { allMessageTypes } from './types/signal';
import { deepDecodeUint8Arrays } from './utils';
export class SynClient {
    constructor(cellClient, handleSignal, zomeName = 'syn') {
        this.cellClient = cellClient;
        this.handleSignal = handleSignal;
        this.zomeName = zomeName;
        this.unsubscribe = () => { };
        cellClient
            .addSignalHandler(signal => {
            console.log(signal);
            if (isEqual(cellClient.cellId, signal.data.cellId) &&
                signal.data.payload.message &&
                allMessageTypes.includes(signal.data.payload.message.type)) {
                handleSignal(deepDecodeUint8Arrays(signal.data.payload));
            }
        })
            .then(({ unsubscribe }) => (this.unsubscribe = unsubscribe));
    }
    close() {
        return this.unsubscribe();
    }
    /** Content */
    putSnapshot(content) {
        return this.callZome('put_snapshot', encode(content));
    }
    async getSnapshot(snapshotHash) {
        const content = await this.callZome('get_snapshot', snapshotHash);
        return decode(content);
    }
    /** Commits */
    commit(commitInput) {
        const commit = Object.assign(Object.assign({}, commitInput), { commit: Object.assign(Object.assign({}, commitInput.commit), { changes: this.encodeChangeBundle(commitInput.commit.changes) }) });
        return this.callZome('commit', commit);
    }
    /** Hash */
    hashContent(content) {
        return this.callZome('hash_content', encode(content));
    }
    /** Session */
    async getSession(sessionHash) {
        const sessionInfo = await this.callZome('get_session', sessionHash);
        return this.decodeSessionInfo(sessionInfo);
    }
    async newSession(newSessionInput) {
        const sessionInfo = await this.callZome('new_session', newSessionInput);
        return this.decodeSessionInfo(sessionInfo);
    }
    async deleteSession(sessionHash) {
        return this.callZome('delete_session', sessionHash);
    }
    getSessions() {
        return this.callZome('get_sessions', null);
    }
    /** Folks */
    getFolks() {
        return this.callZome('get_folks', null);
    }
    sendFolkLore(sendFolkLoreInput) {
        return this.callZome('send_folk_lore', sendFolkLoreInput);
    }
    /** Sync */
    sendSyncRequest(syncRequestInput) {
        return this.callZome('send_sync_request', syncRequestInput);
    }
    sendSyncResponse(syncResponseInput) {
        const missedCommits = {};
        for (const hash of Object.keys(syncResponseInput.state.missedCommits)) {
            missedCommits[hash] = this.encodeCommit(syncResponseInput.state.missedCommits[hash]);
        }
        const input = Object.assign(Object.assign({}, syncResponseInput), { state: Object.assign(Object.assign({}, syncResponseInput.state), { missedCommits, uncommittedChanges: this.encodeChangeBundle(syncResponseInput.state.uncommittedChanges) }) });
        return this.callZome('send_sync_response', input);
    }
    /** Changes */
    sendChangeRequest(changeRequestInput) {
        const input = Object.assign(Object.assign({}, changeRequestInput), { deltas: changeRequestInput.deltas.map(d => encode(d)) });
        return this.callZome('send_change_request', input);
    }
    sendChange(sendChangeInput) {
        const input = Object.assign(Object.assign({}, sendChangeInput), { changes: this.encodeChangeBundle(sendChangeInput.changes) });
        return this.callZome('send_change', input);
    }
    /** Heartbeat */
    sendHeartbeat(heartbeatInput) {
        return this.callZome('send_heartbeat', heartbeatInput);
    }
    /** Helpers */
    async callZome(fnName, payload) {
        return this.cellClient.callZome(this.zomeName, fnName, payload);
    }
    decodeSessionInfo(sessionInfo) {
        const commits = {};
        for (const [hash, commit] of Object.entries(sessionInfo.commits)) {
            commits[hash] = this.decodeCommit(commit);
        }
        return Object.assign(Object.assign({}, sessionInfo), { commits, snapshot: decode(sessionInfo.snapshot) });
    }
    encodeCommit(commit) {
        return Object.assign(Object.assign({}, commit), { changes: this.encodeChangeBundle(commit.changes) });
    }
    encodeChangeBundle(changes) {
        return Object.assign(Object.assign({}, changes), { deltas: changes.deltas.map(d => encode(d)) });
    }
    decodeCommit(commit) {
        return Object.assign(Object.assign({}, commit), { changes: {
                deltas: commit.changes.deltas.map(d => decode(d)),
            } });
    }
}
//# sourceMappingURL=syn-client.js.map