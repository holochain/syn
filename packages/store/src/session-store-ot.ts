import { Commit, SessionMessage } from '@holochain-syn/client';
import {
  AgentPubKeyMap,
  EntryRecord,
  HashType,
  retype,
} from '@holochain-open-dev/utils';
import {
  Readable,
  get,
  derived,
  Writable,
  writable,
} from '@holochain-open-dev/stores';
import { encode, decode } from '@msgpack/msgpack';
import Automerge, { FreezeObject } from 'automerge';
import { encodeHashToBase64, decodeHashFromBase64, AgentPubKey } from '@holochain/client';
import isEqual from 'lodash-es/isEqual.js';
import { toPromise } from '@holochain-open-dev/stores';

import { SynConfig } from './config.js';
import { OTWorkspaceStore } from './workspace-store-ot.js';

export interface OTSliceStore<S, E> {
  myPubKey: AgentPubKey;

  workspace: OTWorkspaceStore<S, E>;

  state: Readable<S>;
  // state: Readable<any[]>;
  ephemeral: Readable<E>;

  change(updateFn: (state: S, ephemeral: E) => void): void;
}

export function extractSliceOT<S1, E1, S2, E2>(
  sliceStore: OTSliceStore<S1, E1>,
  sliceState: (state: S1) => S2,
  sliceEphemeral: (ephemeralState: E1) => E2
): OTSliceStore<S2, E2> {
  return {
    myPubKey: sliceStore.myPubKey,
    workspace: sliceStore.workspace as any as OTWorkspaceStore<S2, E2>,
    state: derived(sliceStore.state, sliceState),
    ephemeral: derived(sliceStore.ephemeral, sliceEphemeral),
    change: updateFn =>
      sliceStore.change((state1, eph1) => {
        const state2 = sliceState(state1);
        const eph2 = sliceEphemeral(eph1);

        updateFn(state2, eph2);
      }),
  };
}

// ==============================================OTSessionStore==============================================

  export interface OTSessionParticipant {
    lastSeen: number | undefined;
    syncStates: { state: Automerge.SyncState; ephemeral: Automerge.SyncState };
  }
  
  interface NoConfidenceVote {
    fromAgent: Uint8Array;
    forClerk: Uint8Array;
    timestamp: number;
  }

  export class OTSessionStore<S, E> implements OTSliceStore<S, E> {
    get workspace() {
      return this.workspaceStore;
    }
  
    _participants: Writable<AgentPubKeyMap<OTSessionParticipant>>;
    get participants() {
      return derived(this._participants, i => {
        const isActive = (lastSeen: number | undefined) =>
          lastSeen && Date.now() - lastSeen < this.config.hearbeatInterval * 10;
        const isIdle = (lastSeen: number | undefined) =>
          lastSeen &&
          !isActive(lastSeen) &&
          Date.now() - lastSeen < this.config.outOfSessionTimeout;
        const isOffline = (lastSeen: number | undefined) =>
          !lastSeen || Date.now() - lastSeen > this.config.outOfSessionTimeout;
  
        const active = Array.from(i.entries())
          .filter(
            ([pubkey, info]) =>
              isActive(info.lastSeen) && !isEqual(pubkey, this.myPubKey)
          )
          .map(([pubkey, _]) => pubkey);
        active.push(this.myPubKey);
  
        const idle = Array.from(i.entries())
          .filter(([_, info]) => isIdle(info.lastSeen))
          .map(([pubkey, _]) => pubkey);
        const offline = Array.from(i.entries())
          .filter(([_, info]) => isOffline(info.lastSeen))
          .map(([pubkey, _]) => pubkey);
  
        return {
          active,
          idle,
          offline,
        };
      });
    }
  
    _state: Writable<Automerge.Doc<S>>;
    get state(): Readable<S> {
      return derived(this._state, i => Automerge.clone(i) as S);
    }

    // _state: Writable<any[]>;
    // get state(): Readable<any[]> {
    //   return derived(this._state, i => JSON.parse(JSON.stringify(i)));
    // }
  
    _ephemeral: Writable<Automerge.Doc<E>>;
    get ephemeral(): Readable<E> {
      return derived(this._ephemeral, i => JSON.parse(JSON.stringify(i)));
    }
  
    _currentTip: Writable<EntryRecord<Commit> | undefined>;
    get currentTip() {
      return derived(this._currentTip, i => i);
    }

    _clerk: Writable<AgentPubKey>;
    get clerk() {
      return this._clerk;
    }

    _clerkStatus: Writable<"unassigned" | "searching" | "disagreement" | "found" | "electing"> = writable("unassigned");
    get clerkStatus() {
      return this._clerkStatus;
    }

    _chronicle: Writable<any[]>;
    get chronicle(): Readable<any[]> {
      return derived(this._chronicle, i => JSON.parse(JSON.stringify(i)));
    }

    _noConfidenceVotes: Writable<NoConfidenceVote[]> = writable([]);
    get noConfidenceVotes(): Readable<NoConfidenceVote[]> {
      return this._noConfidenceVotes;
    }

  
    private unsubscribe: () => void = () => { };
    private intervals: any[] = [];
    private deltaCount = 0;
  
    get myPubKey() {
      return this.synClient.client.myPubKey;
    }
  
    get synClient() {
      return this.workspaceStore.documentStore.synStore.client;
    }
  
    private constructor(
      protected workspaceStore: OTWorkspaceStore<S, E>,
      protected onLeave: () => void,
      protected config: SynConfig,
      currentState: Automerge.Doc<S>,
      currentTip: EntryRecord<Commit> | undefined,
      initialParticipants: Array<AgentPubKey>,
      clerk: AgentPubKey,
    ) {
      this._clerk = writable(clerk);
      this._clerkStatus = writable("unassigned");
      this._chronicle = writable([]);
      const workspaceHash = this.workspaceStore.workspaceHash;
      this.unsubscribe = this.synClient.onSignal(async synSignal => {
        if (synSignal.type !== 'SessionMessage') return;
        if (isEqual(synSignal.provenance, this.myPubKey)) return;
  
        const message: SessionMessage = synSignal.message;
        if (
          message &&
          isEqual(message.workspace_hash, workspaceStore.workspaceHash)
        ) {

          if (message.payload.type === 'VoteOfNoConfidence') {
            if (get(this.clerkStatus) != "found") return;
            this.handleVoteOfNoConfidence(synSignal.provenance, message.payload.for_clerk);
          }

          if (message.payload.type === 'LeaveSession') {
            this.handleLeaveSessionNotice(synSignal.provenance);
            return;
          }
  
          if (
            message.payload.type === 'JoinSession' ||
            !get(this._participants).get(synSignal.provenance)
          ) {
            this.handleNewParticipant(synSignal.provenance);
          } else {
            this._participants.update(p => {
              const participantInfo = p.get(synSignal.provenance);
              participantInfo.lastSeen = Date.now();
              p.set(synSignal.provenance, participantInfo);
  
              return p;
            });
          }
  
          if (message.payload.type === 'NewCommit') {
            const currentTip = get(this._currentTip);
            let newCommit = new EntryRecord<Commit>(message.payload.new_commit);
  
            if (
              currentTip &&
              !newCommit.entry.previous_commit_hashes.find(
                previous_commit =>
                  previous_commit.toString() === currentTip.actionHash.toString()
              )
            ) {
              // We are out of sync with the author of the commit: sync again
              this.requestSync(message.payload.new_commit.signed_action.hashed.content.author);
  
              // TODO: This was old merge conflict management, lead to many commits being created
              // What to do about this?
  
              // newCommit = await this.workspaceStore.merge([
              //   currentTip.actionHash,
              //   newCommit.actionHash,
              // ]);
  
              // this.workspaceStore.documentStore.synStore.client.sendMessage(
              //   Array.from(get(this._participants).keys()),
              //   {
              //     workspace_hash: this.workspaceStore.workspaceHash,
              //     payload: {
              //       type: 'NewCommit',
              //       new_commit: newCommit.record,
              //     },
              //   }
              // );
            }
  
            this._currentTip.set(newCommit);
            return;
          }
  
  
          // TODO: handle OT message types
  
          if (message.payload.type === 'ChangeNotice') {
            this.handleChangeNotice(
              synSignal.provenance,
              message.payload.state_changes.map(
                c => decode(c) as Automerge.BinaryChange
              ),
              message.payload.ephemeral_changes.map(
                c => decode(c) as Automerge.BinaryChange
              )
            );
          }
          if (message.payload.type === 'SyncReq') {
            this.handleSyncRequest(
              synSignal.provenance,
              message.payload.sync_message
                ? (decode(
                  message.payload.sync_message
                ) as Automerge.BinarySyncMessage)
                : undefined,
              message.payload.ephemeral_sync_message
                ? (decode(
                  message.payload.ephemeral_sync_message
                ) as Automerge.BinarySyncMessage)
                : undefined
            );
          }

          if (message.payload.type === 'SendOperationsToClerk') {
            this.intakeOperationsAsClerk(
              synSignal.provenance,
              message.payload.operations,
              decode(message.payload.last_known_op_index) as number
            );
          }

          // if (message.payload.type === 'ValidateOperationsAsClerk') {
          //   console.log("clerk validated operations", synSignal.provenance, message.payload)
          //   let operations = message.payload.operations;
          //   this._ephemeral.update(e => {
          //     e.push(...operations.map(c => decode(c) as any));
          //     return e;
          //   });
          // }
  
          if (message.payload.type === 'Heartbeat') {
            this.handleHeartbeat(
              synSignal.provenance,
              message.payload.known_participants,
              message.payload.clerk
            );
          }

          if (message.payload.type === 'ClerkReq') {
            this.workspaceStore.documentStore.synStore.client.sendMessage(
              [synSignal.provenance],
              {
                workspace_hash: this.workspaceStore.workspaceHash,
                payload: {
                  type: 'ClerkResp',
                  clerk: get(this.clerk),
                },
              }
            );
          }

          if (message.payload.type === 'InitiateElection') {
            if (get(this.clerkStatus) != "electing") {
              this._clerkStatus.set("electing");
              this.handleElectionNotice(message.payload.previous_clerk);
            };
          }

          if (message.payload.type === 'RequestSyncAsNewClerk') {
            if (get(this.clerkStatus) != "electing" && isEqual(get(this.clerk), synSignal.provenance)) {
              this.informClerk(synSignal.provenance, decode(message.payload.last_known_op_index) as number);
            };
          }

          if (message.payload.type === 'ClerkAccepted') {
            if (get(this.clerkStatus) != "electing" && isEqual(get(this.clerk), synSignal.provenance)) {
              this._clerkStatus.set("found");
            };
          }

        }
      });
  
      const discoveryNewParticipants = setInterval(async () => {
        const participants = await this.synClient.getWorkspaceSessionParticipants(
          workspaceHash
        );
  
        this._participants.update(p => {
          const newParticipants = participants.filter(
            maybeNew =>
              !p.has(retype(maybeNew.target, HashType.AGENT)) &&
              !isEqual(this.myPubKey, retype(maybeNew.target, HashType.AGENT))
          );
  
          for (const newParticipant of newParticipants) {
            p.set(retype(newParticipant.target, HashType.AGENT), {
              lastSeen: undefined,
              syncStates: {
                state: Automerge.initSyncState(),
                ephemeral: Automerge.initSyncState(),
              },
            });
  
            this.requestSync(retype(newParticipant.target, HashType.AGENT));
          }
          return p;
        });
      }, config.newPeersDiscoveryInterval * 10);
      this.intervals.push(discoveryNewParticipants);
  
      const heartbeatInterval = setInterval(async () => {
        if (get(this.clerkStatus) == "unassigned") {
          this._clerkStatus.set("searching");
          await this.requestClerks();
        }

        if (get(this.clerkStatus) == "found") {
          let currentClerk = get(this.clerk);
          if (!currentClerk) {
            currentClerk = this.getNewClerk();
            this._clerk.set(currentClerk);
          }
          this._participants.update(p => {
            const onlineParticipants = Array.from(p.entries())
              .filter(
                ([_participant, info]) =>
                  info.lastSeen &&
                  Date.now() - info.lastSeen < config.outOfSessionTimeout
              )
              .map(([p, _]) => p);
    
            if (p.size > 0) {
              this.synClient.sendMessage(onlineParticipants, {
                workspace_hash: workspaceHash,
                payload: {
                  type: 'Heartbeat',
                  known_participants: onlineParticipants,
                  clerk: currentClerk
                },
              });
            }
            return p;
          });
        }
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
          this._commitChanges();
        }
      }, this.config.commitStrategy.CommitEveryNMs);
      this.intervals.push(commitInterval);
  
      this._state = writable(currentState);
      this._currentTip = writable(currentTip);
  
      const participantsMap: AgentPubKeyMap<OTSessionParticipant> =
        new AgentPubKeyMap();
  
      for (const p of initialParticipants) {
        participantsMap.set(p, {
          lastSeen: undefined,
          syncStates: {
            state: Automerge.initSyncState(),
            ephemeral: Automerge.initSyncState(),
            // lastOpIndex: 0
          },
        });
      }
  
      this._participants = writable(participantsMap);
  
      let eph = Automerge.init() as FreezeObject<E>;
  
      this._ephemeral = writable(eph);
  
      for (const p of initialParticipants) {
        this.requestSync(p);
      }
    }
  
    static async joinSession<S, E>(
      workspaceStore: OTWorkspaceStore<S, E>,
      onLeave: () => void,
      config: SynConfig
    ): Promise<OTSessionStore<S, E>> {
      const participants =
        await workspaceStore.documentStore.synStore.client.joinWorkspaceSession(
          workspaceStore.workspaceHash
        );
  
      // const hostPubKey = participants[0];
      // const hostPubKey = await toPromise(workspaceStore.hosts[0]);
      const currentTip = await toPromise(workspaceStore.tip);
      const currentState: S = await toPromise(workspaceStore.latestSnapshot);
      const clerk = participants[0];
  
      return new OTSessionStore(
        workspaceStore,
        onLeave,
        config,
        currentState as Automerge.Doc<S>,
        currentTip,
        participants.filter(
          p =>
            workspaceStore.documentStore.synStore.client.client.myPubKey.toString() !==
          p.toString()
        ),
        clerk,
      );
    }
  
    handleVoteOfNoConfidence(fromAgent: AgentPubKey, forClerk: AgentPubKey) {
      this._noConfidenceVotes.update(v => {
        v.push({
          fromAgent: fromAgent,
          forClerk: forClerk,
          timestamp: Date.now()
        });
        return v;
      })

      // only votes in the last minute
      let recentVotes = get(this.noConfidenceVotes).filter(v => Date.now() - v.timestamp < 60000);

      // only one vote per fromAgent
      let uniqueVotes: NoConfidenceVote[] = []
      recentVotes.forEach(v => {
        if (!uniqueVotes.find(uv => isEqual(uv.fromAgent, v.fromAgent))) {
          uniqueVotes.push(v);
        }
      });

      let mostCommonForAgent = uniqueVotes.reduce((acc, curr) => {
        let agentString = encodeHashToBase64(curr.forClerk);
        if (acc[agentString]) {
          acc[agentString] += 1;
        } else {
          acc[agentString] = 1;
        }
        return acc;
      }).forClerk;

      // filter for only most common agent as forAgent
      let totalVotes = uniqueVotes.filter(v => isEqual(v.forClerk, mostCommonForAgent)).length;

      if (totalVotes > (get(this.participants).active.length / 4)) {
        this.initiateElection();
      }
    }

    getNewClerk(): AgentPubKey {
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
      return decodeHashFromBase64(activeParticipants[0]) as AgentPubKey;
    }
  
    sendOperationsToClerk(operations: any[], last_known_op_index: number): Promise<any[]> {
      let clerkPubKey = get(this.clerk);
      
      // if (encodeHashToBase64(clerkPubKey) === encodeHashToBase64(this.myPubKey)) {
      if (isEqual(clerkPubKey, this.myPubKey)) {
        const newOps = this.intakeOperationsAsClerk(this.myPubKey, operations.map(c => encode(c) as any), last_known_op_index);
        return Promise.resolve(newOps.map(c => decode(c) as any[]));
      } else {
        this.workspaceStore.documentStore.synStore.client.sendMessage(
          [clerkPubKey],
          {
            workspace_hash: this.workspaceStore.workspaceHash,
            payload: {
              type: 'SendOperationsToClerk',
              operations: operations.map(c => encode(c) as any),
              last_known_op_index: encode(last_known_op_index) as any,
            },
          }
        );
      }

      // listen for synsignal and return it
      return new Promise((resolve, reject) => {
        // Listen for synsignal and resolve the promise
        const unsub = this.workspaceStore.documentStore.synStore.client.onSignal(synSignal => {
          if (synSignal.type !== 'SessionMessage') return;
          if (isEqual(synSignal.provenance, this.myPubKey)) return;
    
          const message: SessionMessage = synSignal.message;
          if (
            message &&
            isEqual(message.workspace_hash, this.workspaceStore.workspaceHash)
          ) {
            if (message.payload.type === 'ImNotTheClerk') {
              unsub();
              clearTimeout(timeoutId);
              this._clerkStatus.set("disagreement");
              this._clerk.set(message.payload.clerk);
              this.sendOperationsToClerk(operations, last_known_op_index)
              .then(result => {
                  this._clerkStatus.set('found');
                  resolve(result);
                })
              .catch(reject);      
            }
            if (message.payload.type === 'ValidateOperationsAsClerk') {
              let prevUnrecordedOps = message.payload.operations;
              this._chronicle.update(e => {
                return [
                  ...e,
                  ...prevUnrecordedOps.map(c => decode(c) as any),
                  ...operations,
                ]
              })
              unsub();
              clearTimeout(timeoutId); // Clear the timeout
              resolve(prevUnrecordedOps.map(c => decode(c) as any[]));
            }
          }
        });
    
        // Optionally, you can add a timeout to reject the promise if no signal is received within a certain time
        const timeoutId = setTimeout(() => {
          unsub();
          // send vote of no confidence
          this.workspaceStore.documentStore.synStore.client.sendMessage(
            get(this.participants).active,
            {
              workspace_hash: this.workspaceStore.workspaceHash,
              payload: {
                type: 'VoteOfNoConfidence',
                for_clerk: clerkPubKey,
              },
            }
          );
          this.handleVoteOfNoConfidence(this.myPubKey, clerkPubKey);
          reject(new Error("Timeout waiting for clerk validation"));
        }, 3000); // 5 seconds timeout
      });
    }

    broadcastNewOperations(operations: any[]) {
      this.workspaceStore.documentStore.synStore.client.sendMessage(
        get(this.participants).active,
        {
          workspace_hash: this.workspaceStore.workspaceHash,
          payload: {
            type: 'NewOperationsBroadcast',
            operations: operations,
          },
        }
      );
    }
  
    intakeOperationsAsClerk(fromAgent: AgentPubKey, newOperations: any[], lastKnownOpIndex: number) {
      // make sure I'm the clerk
      if (!isEqual(get(this.clerk), this.myPubKey)) {
        this.workspaceStore.documentStore.synStore.client.sendMessage(
          [fromAgent],
          {
            workspace_hash: this.workspaceStore.workspaceHash,
            payload: {
              type: 'ImNotTheClerk',
              clerk: get(this.clerk),
            },
          }
        );
        return [];
      }

      // let mergeMethod = this.workspaceStore.documentStore.synStore.mergeMethod;
      // let otTransformFunction = mergeMethod.type == 'OT' ? mergeMethod.opsTransform : undefined;
      // let transformedOperations = otTransformFunction ? otTransformFunction(previousOperations, newOperations) : [];
      // let fromAgentInfo = get(this._participants).get(fromAgent);

      let previousOperations = get(this.chronicle);
      // let previousOperations = get(this.state);

      let newOperationsForAgent: any[] = previousOperations
                                          // .slice(fromAgentInfo.syncStates.lastOpIndex + 1, previousOperations.length)
                                          .slice(lastKnownOpIndex + 1, previousOperations.length)
                                          .map(c => encode(c) as any)

      // add to chronicle
      this._chronicle.update(e => {
        e.push(...newOperations.map(c => decode(c) as any));
        return e;
      });

      if (!isEqual(fromAgent, this.myPubKey)) {
        // respond to the client with the transformed operations
        this.workspaceStore.documentStore.synStore.client.sendMessage(
          [fromAgent],
          {
            workspace_hash: this.workspaceStore.workspaceHash,
            payload: {
              type: 'ValidateOperationsAsClerk',
              operations: newOperationsForAgent,
            },
          }
        );
      }
  
      // broadcast new operations
      this.broadcastNewOperations(newOperations);

      // apply the transformed operations to the previousOperations object
      return newOperationsForAgent;
    }

    change(updateFn: (state: S, ephemeral: E) => void) {
      this._state.update(state => {
        let newState = state;
        this._ephemeral.update(ephemeralState => {
          let newEphemeralState = ephemeralState;
  
          newState = Automerge.change(newState, doc => {
            newEphemeralState = Automerge.change(newEphemeralState, eph => {
              updateFn(doc as S, eph as E);
            });
          });
  
          const stateChanges = Automerge.getChanges(state, newState);
          const ephemeralChanges = Automerge.getChanges(
            ephemeralState,
            newEphemeralState
          );
          this.deltaCount += stateChanges.length;
          if (
            this.config.commitStrategy.CommitEveryNDeltas &&
            this.deltaCount > this.config.commitStrategy.CommitEveryNDeltas
          ) {
            this._commitChanges();
          }
  
          const participants = get(this._participants).keys();
  
          this.workspaceStore.documentStore.synStore.client.sendMessage(
            Array.from(participants),
            {
              workspace_hash: this.workspaceStore.workspaceHash,
              payload: {
                type: 'ChangeNotice',
                state_changes: stateChanges.map(c => encode(c) as any),
                ephemeral_changes: ephemeralChanges.map(c => encode(c) as any),
              },
            }
          );
          return newEphemeralState;
        });
  
        return newState;
      });
    }
  
    private handleChangeNotice(
      from: AgentPubKey,
      stateChanges: Automerge.BinaryChange[],
      ephemeralChanges: Automerge.BinaryChange[]
    ) {
      this.deltaCount += stateChanges.length;
  
      let thereArePendingChanges = false;
  
      this._state.update(state => {
        const stateChangesInfo = Automerge.applyChanges(state, stateChanges);
  
        thereArePendingChanges =
          thereArePendingChanges || stateChangesInfo[1].pendingChanges > 0;
  
        return stateChangesInfo[0];
      });
  
      this._ephemeral.update(ephemeral => {
        const ephemeralChangesInfo = Automerge.applyChanges(
          ephemeral,
          ephemeralChanges
        );
  
        thereArePendingChanges =
          thereArePendingChanges || ephemeralChangesInfo[1].pendingChanges > 0;
  
        return ephemeralChangesInfo[0];
      });
  
      if (thereArePendingChanges) {
        this.requestSync(from);
      }
    }
  
    requestSync(participant: AgentPubKey) {
      const syncStates = get(this._participants).get(participant).syncStates;
  
      const [nextSyncState, syncMessage] = Automerge.generateSyncMessage(
        get(this._state),
        syncStates.state
      );
      const [ephemeralNextSyncState, ephemeralSyncMessage] =
        Automerge.generateSyncMessage(get(this._ephemeral), syncStates.ephemeral);
  
      this._participants.update(p => {
        const info = p.get(participant);
        p.set(participant, {
          ...info,
          syncStates: {
            state: nextSyncState,
            ephemeral: ephemeralNextSyncState,
          },
        });
        return p;
      });
  
      if (syncMessage || ephemeralSyncMessage) {
        this.workspaceStore.documentStore.synStore.client.sendMessage(
          [participant],
          {
            workspace_hash: this.workspaceStore.workspaceHash,
            payload: {
              type: 'SyncReq',
              sync_message: syncMessage ? encode(syncMessage) : undefined,
              ephemeral_sync_message: ephemeralSyncMessage
                ? encode(ephemeralSyncMessage)
                : undefined,
            },
          }
        );
      }
    }
  
    private handleSyncRequest(
      from: AgentPubKey,
      syncMessage: Automerge.BinarySyncMessage | undefined,
      ephemeralSyncMessage: Automerge.BinarySyncMessage | undefined
    ) {
      this._participants.update(p => {
        const participantInfo = p.get(from);
  
        if (syncMessage) {
          this._state.update(state => {
            const [nextDoc, nextSyncState, _message] =
              Automerge.receiveSyncMessage(
                state,
                participantInfo.syncStates.state,
                syncMessage
              );
            const changes = Automerge.getChanges(state, nextDoc);
            this.deltaCount += changes.length;
  
            participantInfo.syncStates.state = nextSyncState;
            return nextDoc;
          });
        }
  
        if (ephemeralSyncMessage) {
          this._ephemeral.update(ephemeral => {
            const [nextDoc, nextSyncState, _message] =
              Automerge.receiveSyncMessage(
                ephemeral,
                participantInfo.syncStates.ephemeral,
                ephemeralSyncMessage
              );
  
            participantInfo.syncStates.ephemeral = nextSyncState;
  
            return nextDoc;
          });
        }
  
        p.set(from, participantInfo);
        return p;
      });
  
      this.requestSync(from);
    }

    async requestClerks(): Promise<AgentPubKey> {
      this.workspaceStore.documentStore.synStore.client.sendMessage(
        get(this.participants).active,
        {
          workspace_hash: this.workspaceStore.workspaceHash,
          payload: {
            type: 'ClerkReq',
            clerk: get(this.clerk),
          },
        }
      );

      // listen for messages
      return new Promise((resolve, reject) => {
        let clerkResponses: AgentPubKey[] = [];
        // Add my response
        if (get(this.clerk)) clerkResponses.push(get(this.clerk));
        // Listen for synsignal and resolve the promise
        const unsub = this.workspaceStore.documentStore.synStore.client.onSignal(synSignal => {
          if (synSignal.type !== 'SessionMessage') return;
          if (isEqual(synSignal.provenance, this.myPubKey)) return;
    
          const message: SessionMessage = synSignal.message;
          if (
            message &&
            isEqual(message.workspace_hash, this.workspaceStore.workspaceHash)
          ) {
            if (message.payload.type === 'ClerkResp') {
              clerkResponses.push(message.payload.clerk);
            }
          }
        });
    
        const requestClerksTimeoutId = setTimeout(() => {
          unsub();
          
          if (clerkResponses.length > 0) {
            let clerkMap = new Map<string, number>();
            let totalVoteCount = 0;

            clerkResponses.forEach(clerk => {
              const clerkKey = encodeHashToBase64(clerk);
              let count = clerkMap.get(clerkKey);
              totalVoteCount++;
              clerkMap.set(clerkKey, count ? count + 1 : 1);
            });

            let maxCount = 0;
            let maxClerk = get(this.clerk);
            let maxClerkKey = encodeHashToBase64(maxClerk);

            clerkMap.forEach((count, clerkKey) => {
              if (count > maxCount) {
                maxCount = count;
                maxClerkKey = clerkKey;
              }
            });

            maxClerk = decodeHashFromBase64(maxClerkKey);

            if (maxCount > totalVoteCount / 2) {
              this._clerk.set(maxClerk);
              this._clerkStatus.set("found");
              clearTimeout(requestClerksTimeoutId);
              resolve(maxClerk);
            } else {
              this.initiateElection();
              clearTimeout(requestClerksTimeoutId);
              reject(new Error("No clerk consensus"));
            }
          }

          // if no responses, just make the best guess
          this._clerk.set(this.getNewClerk());
          this._clerkStatus.set("found");
          reject(new Error("No clerk resps in time"));
        }, 30000); // 3 seconds timeout
      });
    }

    async initiateElection() {
      if (get(this.clerkStatus) == "electing") return;
      this._clerkStatus.set("electing");
      let participants = get(this.participants).active;
      this.workspaceStore.documentStore.synStore.client.sendMessage(
        participants,
        {
          workspace_hash: this.workspaceStore.workspaceHash,
          payload: {
            type: 'InitiateElection',
            previous_clerk: get(this.clerk),
          },
        }
      );
      this.handleElectionNotice(get(this.clerk));
    }

    async handleElectionNotice(previousClerk: AgentPubKey) {
      this.listenForVotes();

      setTimeout(() => {
        let newClerk = this.getNewClerk();
        this.workspaceStore.documentStore.synStore.client.sendMessage(
          get(this.participants).active,
          {
            workspace_hash: this.workspaceStore.workspaceHash,
            payload: {
              type: 'VoteInElection',
              previous_clerk: previousClerk,
              nomination: newClerk,
            },
          }
        );
      }, 5000); // 5 seconds timeout
    }

    async listenForVotes() {
      let votes = new Map<string, number>();
      let maxVotes = 0;
      let maxClerk = get(this.clerk);
      let maxClerkKey = encodeHashToBase64(maxClerk);
    
      const unsubElection = this.workspaceStore.documentStore.synStore.client.onSignal(synSignal => {
        if (synSignal.type !== 'SessionMessage') return;
    
        const message: SessionMessage = synSignal.message;
        if (
          message &&
          isEqual(message.workspace_hash, this.workspaceStore.workspaceHash)
        ) {
          if (message.payload.type === 'VoteInElection') {
            let nomination = message.payload.nomination;
            const nominationKey = encodeHashToBase64(nomination);
            let count = votes.get(nominationKey);
            votes.set(nominationKey, count ? count + 1 : 1);
            if ((votes.get(nominationKey) ?? 0) > maxVotes) {
              maxVotes = votes.get(nominationKey) ?? 0;
              maxClerkKey = nominationKey;
              maxClerk = nomination;
            }
          }
        }
      });
    
      setTimeout(() => {
        unsubElection();
        maxClerk = decodeHashFromBase64(maxClerkKey); // Decode back to Uint8Array
        this._clerk.set(maxClerk);
        if (isEqual(maxClerk, this.myPubKey)) {
          this.acceptClerk();
        }
      }, 5000); // 5 seconds timeout
    }
  
    async acceptClerk() {
      this.workspaceStore.documentStore.synStore.client.sendMessage(
        get(this.participants).active,
        {
          workspace_hash: this.workspaceStore.workspaceHash,
          payload: {
            type: 'RequestSyncAsNewClerk',
            last_known_op_index: encode(get(this.chronicle).length - 1),
          },
        }
      );

      let longestChronicleUpdate: Uint8Array[] = [];

      const unsubClerkSync = this.workspaceStore.documentStore.synStore.client.onSignal(synSignal => {
        if (synSignal.type !== 'SessionMessage') return;
        if (isEqual(synSignal.provenance, this.myPubKey)) return;
    
        const message: SessionMessage = synSignal.message;
        if (
          message &&
          isEqual(message.workspace_hash, this.workspaceStore.workspaceHash)
        ) {
          if (message.payload.type === 'InformClerk') {
            if (message.payload.operations.length > longestChronicleUpdate.length) {
              longestChronicleUpdate = message.payload.operations;
            }
          }
        }
      });

      setTimeout(() => {
        // add longestChronicleUpdate to chronicle
        unsubClerkSync();
        this._chronicle.update(e => {
          e.push(...longestChronicleUpdate.map(c => decode(c) as any));
          return e;
        });
        this._clerkStatus.set("found");
        this.workspaceStore.documentStore.synStore.client.sendMessage(
          get(this.participants).active,
          {
            workspace_hash: this.workspaceStore.workspaceHash,
            payload: {
              type: 'ClerkAccepted',
            },
          }
        )
        }, 10000); // 10 seconds timeout
    }

    async informClerk(clerk: AgentPubKey, lastOpIndex: number) {
      this.workspaceStore.documentStore.synStore.client.sendMessage(
        [clerk],
        {
          workspace_hash: this.workspaceStore.workspaceHash,
          payload: {
            type: 'InformClerk',
            operations: get(this.chronicle).slice(lastOpIndex + 1).map(c => encode(c) as any),
          },
        }
      );
    }

    _previousCommitPromise: Promise<void> | undefined;
  
    // This is the version public version of commitChanges that will
    // await for any pending commit and issue a commit afterwards.
    async commitChanges(meta?: any) {
      if (this._previousCommitPromise) await this._previousCommitPromise;
      this._previousCommitPromise = this.commitChangesInternal(meta);
  
      return this._previousCommitPromise;
    }
  
    // This is the version of commitChanges that is called by the
    // periodic update manager.  if there is allready a commit in progress
    // the request is ignored and it is assumed that it will be completed
    // later
    private async _commitChanges(meta?: any) {
      if (this._previousCommitPromise) {
        // console.log("prev commit promise exists, ignoring...")
        await this._previousCommitPromise;
        this._previousCommitPromise = undefined
        return
      }
  
      this._previousCommitPromise = this.commitChangesInternal(meta);
      return this._previousCommitPromise;
    }
  
    private async commitChangesInternal(meta?: any) {
      const latestSnapshot = await toPromise(this.workspaceStore.latestSnapshot);
  
      if (
        isEqual(
          Automerge.save(latestSnapshot as Automerge.Doc<S>),
          Automerge.save(get(this._state))
        )
      ) {
        // Nothing to commit, just return
        return;
      }
      this.deltaCount = 0;
  
      if (meta) {
        meta = encode(meta);
      }
  
      const currentTip = get(this._currentTip);
      const previous_commit_hashes = currentTip ? [currentTip.actionHash] : [];
      const commit: Commit = {
        authors: [
          ...Array.from(get(this._participants).keys()),
          this.synClient.client.myPubKey,
        ],
        meta,
        previous_commit_hashes,
        state: encode(Automerge.save(get(this._state))),
        witnesses: [],
        document_hash: this.workspaceStore.documentStore.documentHash,
      };
  
      const newCommit = await this.synClient.createCommit(commit);
  
      this._currentTip.set(newCommit);
      this.workspaceStore.documentStore.synStore.client.sendMessage(
        Array.from(get(this._participants).keys()),
        {
          workspace_hash: this.workspaceStore.workspaceHash,
          payload: {
            type: 'NewCommit',
            new_commit: newCommit.record,
          },
        }
      );
  
      await this.synClient.updateWorkspaceTip(
        this.workspaceStore.workspaceHash,
        newCommit.actionHash,
        previous_commit_hashes
      );
    }
  
    private handleHeartbeat(_from: AgentPubKey, participants: AgentPubKey[], clerk?: AgentPubKey) {
      this._participants.update(p => {
        const newParticipants = participants.filter(
          maybeNew => !p.has(maybeNew) && !isEqual(maybeNew, this.myPubKey)
        );
  
        for (const newParticipant of newParticipants) {
          p.set(newParticipant, {
            lastSeen: undefined,
            syncStates: {
              state: Automerge.initSyncState(),
              ephemeral: Automerge.initSyncState(),
              // lastOpIndex: 0
            },
          });
  
          this.requestSync(newParticipant);
        }
  
        return p;
      });

      if (clerk && !isEqual(clerk, get(this.clerk)) && get(this.clerkStatus) == "found") {
        this.handleClerkDisagreement();
      }
    }
  
    private async handleClerkDisagreement() {
      this._clerkStatus.set("disagreement");
      const newClerk = await this.requestClerks();
      if (newClerk) {
        this._clerk.set(newClerk);
      }
      // heartbeat to anyone with different clerk
      // if tie, start a vote
    }

    async leaveSession(): Promise<void> {
      const participants = get(this.participants).active;
  
      if (participants.length === 1) {
        await this.commitChanges();
      }
  
      await this.synClient.leaveWorkspaceSession(
        this.workspaceStore.workspaceHash
      );
      this.unsubscribe();
      for (const interval of this.intervals) {
        clearInterval(interval);
      }
      this.onLeave();
    }
  
    private handleNewParticipant(participant: AgentPubKey) {
      this._participants.update(p => {
        p.set(participant, {
          lastSeen: Date.now(),
          syncStates: {
            state: Automerge.initSyncState(),
            ephemeral: Automerge.initSyncState(),
            // lastOpIndex: 0
          },
        });
        return p;
      });
      this.requestSync(participant);
    }
  
    private handleLeaveSessionNotice(participant: AgentPubKey) {
      this._participants.update(p => {
        p.delete(participant);
        return p;
      });
    }
  }