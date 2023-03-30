import { writable } from 'svelte/store';
import { derived, get } from 'svelte/store';
import { AgentPubKeyMap, EntryHashMap, RecordBag, } from '@holochain-open-dev/utils';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import { encodeHashToBase64, } from '@holochain/client';
import isEqual from 'lodash-es/isEqual';
import { stateFromCommit } from './syn-store';
export function extractSlice(sliceStore, wrapChange, sliceState, sliceEphemeral) {
    return {
        myPubKey: sliceStore.myPubKey,
        worskpace: sliceStore.worskpace,
        state: derived(sliceStore.state, sliceState),
        ephemeral: derived(sliceStore.ephemeral, sliceEphemeral),
        requestChanges: changes => sliceStore.requestChanges(changes.map(wrapChange)),
    };
}
export class WorkspaceStore {
    constructor(rootStore, config, workspaceHash, currentTip, initialParticipants) {
        this.rootStore = rootStore;
        this.config = config;
        this.workspaceHash = workspaceHash;
        this.unsubscribe = () => { };
        this.intervals = [];
        this.unsubscribe = this.rootStore.client.client.on('signal', signal => {
            const synSignal = signal.payload;
            if (synSignal.message.type !== 'WorkspaceMessage')
                return;
            if (isEqual(synSignal.provenance, this.myPubKey))
                return;
            const message = synSignal.message;
            if (message && isEqual(message.workspace_hash, workspaceHash)) {
                if (message.payload.type === 'LeaveWorkspace') {
                    this.handleLeaveWorkspaceNotice(synSignal.provenance);
                    return;
                }
                if (message.payload.type === 'JoinWorkspace' ||
                    !get(this._participants).get(synSignal.provenance)) {
                    this.handleNewParticipant(synSignal.provenance);
                }
                else {
                    this._participants.update(p => {
                        const participantInfo = p.get(synSignal.provenance);
                        participantInfo.lastSeen = Date.now();
                        p.put(synSignal.provenance, participantInfo);
                        return p;
                    });
                }
                if (message.payload.type === 'ChangeNotice') {
                    this.handleChangeNotice(synSignal.provenance, message.payload.state_changes.map(c => decode(c)), message.payload.ephemeral_changes.map(c => decode(c)));
                }
                if (message.payload.type === 'SyncReq') {
                    this.handleSyncRequest(synSignal.provenance, message.payload.sync_message
                        ? decode(message.payload.sync_message)
                        : undefined, message.payload.ephemeral_sync_message
                        ? decode(message.payload.ephemeral_sync_message)
                        : undefined);
                }
                if (message.payload.type === 'Heartbeat') {
                    this.handleHeartbeat(synSignal.provenance, message.payload.known_participants);
                }
            }
        });
        const heartbeatInterval = setInterval(async () => {
            const participants = await this.rootStore.client.getWorkspaceParticipants(workspaceHash);
            this._participants.update(p => {
                const newParticipants = participants.filter(maybeNew => !p.has(maybeNew) && !isEqual(this.myPubKey, maybeNew));
                for (const newParticipant of newParticipants) {
                    p.put(newParticipant, {
                        lastSeen: undefined,
                        syncStates: {
                            state: Automerge.initSyncState(),
                            ephemeral: Automerge.initSyncState(),
                        },
                    });
                    this.requestSync(newParticipant);
                }
                for (const [participant, info] of p.entries()) {
                    if (!info.lastSeen ||
                        Date.now() - info.lastSeen > config.outOfSessionTimeout) {
                        p.delete(participant);
                    }
                }
                if (p.keys().length > 0) {
                    this.rootStore.client.sendMessage(p.keys(), {
                        type: 'WorkspaceMessage',
                        workspace_hash: workspaceHash,
                        payload: {
                            type: 'Heartbeat',
                            known_participants: p.keys(),
                        },
                    });
                }
                return p;
            });
        }, config.hearbeatInterval);
        this.intervals.push(heartbeatInterval);
        const commitInterval = setInterval(async () => {
            const activeParticipants = get(this.participants)
                .active.map(p => encodeHashToBase64(p))
                .sort((p1, p2) => {
                if (p1 < p2) {
                    return -1;
                }
                if (p1 > p2) {
                    return 1;
                }
                return 0;
            });
            if (activeParticipants[0] === encodeHashToBase64(this.myPubKey)) {
                this.commitChanges();
            }
        }, this.config.commitStrategy.CommitEveryNMs);
        this.intervals.push(commitInterval);
        const commit = decode(currentTip.entry.Present.entry);
        const state = stateFromCommit(commit);
        this._state = writable(state);
        this._currentTip = writable(currentTip.signed_action.hashed.content.entry_hash);
        const participantsMap = new AgentPubKeyMap();
        for (const p of initialParticipants) {
            participantsMap.put(p, {
                lastSeen: undefined,
                syncStates: {
                    state: Automerge.initSyncState(),
                    ephemeral: Automerge.initSyncState(),
                },
            });
        }
        this._participants = writable(participantsMap);
        let eph = Automerge.init();
        this._ephemeral = writable(eph);
        for (const p of initialParticipants) {
            this.requestSync(p);
        }
    }
    get worskpace() {
        return this;
    }
    get participants() {
        return derived(this._participants, i => {
            const isActive = (lastSeen) => lastSeen && Date.now() - lastSeen < this.config.hearbeatInterval * 2;
            const isIdle = (lastSeen) => lastSeen &&
                Date.now() - lastSeen > this.config.hearbeatInterval * 2 &&
                Date.now() - lastSeen < this.config.outOfSessionTimeout;
            const isOffline = (lastSeen) => !lastSeen || Date.now() - lastSeen > this.config.outOfSessionTimeout;
            const active = i
                .entries()
                .filter(([pubkey, info]) => isActive(info.lastSeen) && !isEqual(pubkey, this.myPubKey))
                .map(([pubkey, _]) => pubkey);
            active.push(this.myPubKey);
            const idle = i
                .entries()
                .filter(([_, info]) => isIdle(info.lastSeen))
                .map(([pubkey, _]) => pubkey);
            const offline = i
                .entries()
                .filter(([_, info]) => isOffline(info.lastSeen))
                .map(([pubkey, _]) => pubkey);
            return {
                active,
                idle,
                offline,
            };
        });
    }
    get state() {
        return derived(this._state, i => Automerge.clone(i));
    }
    get ephemeral() {
        return derived(this._ephemeral, i => JSON.parse(JSON.stringify(i)));
    }
    get currentTip() {
        return derived(this._currentTip, i => i);
    }
    get myPubKey() {
        return this.rootStore.client.client.myPubKey;
    }
    static async joinWorkspace(rootStore, config, workspaceHash) {
        const participants = await rootStore.client.joinWorkspace(workspaceHash);
        const commits = await rootStore.client.getWorkspaceTips(workspaceHash);
        console.log("Tips found:", commits.length);
        const commitBag = new RecordBag(commits);
        const tips = new EntryHashMap(commitBag.entryMap.entries());
        // for (const commit of commitBag.entryMap.values()) {
        //   for (const previousCommitHash of commit.previous_commit_hashes) {
        //     tips.delete(previousCommitHash);
        //   }
        // }
        let currentTipHash = commitBag.entryActions.get(tips.keys()[0])[0];
        let currentTip = commitBag.entryRecord(currentTipHash).record;
        // If there are more that one tip, merge them
        if (tips.keys().length > 1) {
            let mergeState = Automerge.merge(Automerge.load(decode(tips.values()[0].state)), Automerge.load(decode(tips.values()[1].state)));
            for (let i = 2; i < tips.keys().length; i++) {
                mergeState = Automerge.merge(mergeState, Automerge.load(decode(tips.values()[i].state)));
            }
            const commit = {
                authors: [rootStore.client.client.myPubKey],
                meta: encode('Merge commit'),
                previous_commit_hashes: tips.keys(),
                state: encode(Automerge.save(mergeState)),
                witnesses: [],
            };
            const newCommit = await rootStore.client.createCommit({
                commit,
                root_hash: rootStore.root.entryHash,
            });
            currentTip = newCommit.record;
            await rootStore.client.updateWorkspaceTip({
                new_tip_hash: newCommit.entryHash,
                workspace_hash: workspaceHash,
                previous_commit_hashes: tips.keys()
            });
        }
        return new WorkspaceStore(rootStore, config, workspaceHash, currentTip, participants.filter(p => !isEqual(rootStore.myPubKey, p)));
    }
    requestChanges(changes) {
        this._state.update(state => {
            let newState = state;
            this._ephemeral.update(ephemeralState => {
                let newEphemeralState = ephemeralState;
                for (const changeRequested of changes) {
                    newState = Automerge.change(newState, doc => {
                        newEphemeralState = Automerge.change(newEphemeralState, eph => {
                            this.rootStore.grammar.applyDelta(changeRequested, doc, eph, this.myPubKey);
                        });
                    });
                }
                const stateChanges = Automerge.getChanges(state, newState);
                const ephemeralChanges = Automerge.getChanges(ephemeralState, newEphemeralState);
                const participants = get(this._participants).keys();
                this.rootStore.client.sendMessage(participants, {
                    type: 'WorkspaceMessage',
                    workspace_hash: this.workspaceHash,
                    payload: {
                        type: 'ChangeNotice',
                        state_changes: stateChanges.map(c => encode(c)),
                        ephemeral_changes: ephemeralChanges.map(c => encode(c)),
                    },
                });
                return newEphemeralState;
            });
            return newState;
        });
    }
    handleChangeNotice(from, stateChanges, ephemeralChanges) {
        let thereArePendingChanges = false;
        this._state.update(state => {
            const stateChangesInfo = Automerge.applyChanges(state, stateChanges);
            thereArePendingChanges =
                thereArePendingChanges || stateChangesInfo[1].pendingChanges > 0;
            return stateChangesInfo[0];
        });
        this._ephemeral.update(ephemeral => {
            const ephemeralChangesInfo = Automerge.applyChanges(ephemeral, ephemeralChanges);
            thereArePendingChanges =
                thereArePendingChanges || ephemeralChangesInfo[1].pendingChanges > 0;
            return ephemeralChangesInfo[0];
        });
        if (thereArePendingChanges) {
            this.requestSync(from);
        }
    }
    requestSync(participant) {
        const syncStates = get(this._participants).get(participant).syncStates;
        const [nextSyncState, syncMessage] = Automerge.generateSyncMessage(get(this._state), syncStates.state);
        const [ephemeralNextSyncState, ephemeralSyncMessage] = Automerge.generateSyncMessage(get(this._ephemeral), syncStates.ephemeral);
        this._participants.update(p => {
            const info = p.get(participant);
            p.put(participant, Object.assign(Object.assign({}, info), { syncStates: {
                    state: nextSyncState,
                    ephemeral: ephemeralNextSyncState,
                } }));
            return p;
        });
        if (syncMessage || ephemeralSyncMessage) {
            this.rootStore.client.sendMessage([participant], {
                type: 'WorkspaceMessage',
                workspace_hash: this.workspaceHash,
                payload: {
                    type: 'SyncReq',
                    sync_message: syncMessage ? encode(syncMessage) : undefined,
                    ephemeral_sync_message: ephemeralSyncMessage
                        ? encode(ephemeralSyncMessage)
                        : undefined,
                },
            });
        }
    }
    handleSyncRequest(from, syncMessage, ephemeralSyncMessage) {
        this._participants.update(p => {
            const participantInfo = p.get(from);
            if (syncMessage) {
                this._state.update(state => {
                    const [nextDoc, nextSyncState, _message] = Automerge.receiveSyncMessage(state, participantInfo.syncStates.state, syncMessage);
                    participantInfo.syncStates.state = nextSyncState;
                    return nextDoc;
                });
            }
            if (ephemeralSyncMessage) {
                this._ephemeral.update(ephemeral => {
                    const [nextDoc, nextSyncState, _message] = Automerge.receiveSyncMessage(ephemeral, participantInfo.syncStates.ephemeral, ephemeralSyncMessage);
                    participantInfo.syncStates.ephemeral = nextSyncState;
                    return nextDoc;
                });
            }
            p.put(from, participantInfo);
            return p;
        });
        this.requestSync(from);
    }
    async commitChanges(meta) {
        const currentTip = get(this._currentTip);
        const currentTipCommit = await this.rootStore.fetchCommit(currentTip);
        if (currentTipCommit) {
            if (isEqual(decode(currentTipCommit.state), Automerge.save(get(this._state)))) {
                // Nothing to commit, just return
                return;
            }
        }
        if (meta) {
            meta = encode(meta);
        }
        const commit = {
            authors: get(this._participants).keys(),
            meta,
            previous_commit_hashes: [currentTip],
            state: encode(Automerge.save(get(this._state))),
            witnesses: [],
        };
        const newCommit = await this.rootStore.client.createCommit({
            commit,
            root_hash: this.rootStore.root.entryHash,
        });
        await this.rootStore.client.updateWorkspaceTip({
            new_tip_hash: newCommit.entryHash,
            workspace_hash: this.workspaceHash,
            previous_commit_hashes: [currentTip],
        });
        this._currentTip.set(newCommit.entryHash);
    }
    handleHeartbeat(_from, participants) {
        this._participants.update(p => {
            const newParticipants = participants.filter(maybeNew => !p.has(maybeNew) && !isEqual(maybeNew, this.myPubKey));
            for (const newParticipant of newParticipants) {
                p.put(newParticipant, {
                    lastSeen: undefined,
                    syncStates: {
                        state: Automerge.initSyncState(),
                        ephemeral: Automerge.initSyncState(),
                    },
                });
                this.requestSync(newParticipant);
            }
            return p;
        });
    }
    async leaveWorkspace() {
        const participants = get(this.participants).active;
        if (participants.length === 1) {
            await this.commitChanges();
        }
        await this.rootStore.client.leaveWorkspace(this.workspaceHash);
        this.unsubscribe();
        for (const interval of this.intervals) {
            clearInterval(interval);
        }
    }
    handleNewParticipant(participant) {
        this._participants.update(p => {
            p.put(participant, {
                lastSeen: Date.now(),
                syncStates: {
                    state: Automerge.initSyncState(),
                    ephemeral: Automerge.initSyncState(),
                },
            });
            return p;
        });
        this.requestSync(participant);
    }
    handleLeaveWorkspaceNotice(participant) {
        this._participants.update(p => {
            p.delete(participant);
            return p;
        });
    }
}
//# sourceMappingURL=workspace-store.js.map