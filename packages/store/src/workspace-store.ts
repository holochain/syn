import { Commit, WorkspaceMessage, SynSignal } from '@holochain-syn/client';
import { Readable, writable, Writable } from 'svelte/store';
import { derived, get } from 'svelte/store';
import { AgentPubKeyMap, serializeHash } from '@holochain-open-dev/utils';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import { AgentPubKey, Create, EntryHash, Record } from '@holochain/client';
import isEqual from 'lodash-es/isEqual';

import type {
  GrammarState,
  GrammarDelta,
  SynGrammar,
  GrammarEphemeralState,
} from './grammar';

import { SynConfig } from './config';
import { stateFromCommit } from './syn-store';
import { RootStore } from './root-store';

export interface SliceStore<G extends SynGrammar<any, any>> {
  myPubKey: AgentPubKey;

  worskpace: WorkspaceStore<any>;

  state: Readable<Automerge.Doc<GrammarState<G>>>;
  ephemeral: Readable<GrammarEphemeralState<G>>;

  requestChanges(changes: Array<GrammarDelta<G>>): void;
}

export function extractSlice<
  G1 extends SynGrammar<any, any>,
  G2 extends SynGrammar<any, any>
>(
  sliceStore: SliceStore<G1>,
  wrapChange: (change: GrammarDelta<G2>) => GrammarDelta<G1>,
  sliceState: (
    state: Automerge.Doc<GrammarState<G1>>
  ) => Automerge.Doc<GrammarState<G2>>,
  sliceEphemeral: (
    ephemeralState: Automerge.Doc<GrammarEphemeralState<G1>>
  ) => Automerge.Doc<GrammarEphemeralState<G2>>
): SliceStore<G2> {
  return {
    myPubKey: sliceStore.myPubKey,
    worskpace: sliceStore.worskpace as WorkspaceStore<G1>,
    state: derived(sliceStore.state, sliceState),
    ephemeral: derived(sliceStore.ephemeral, sliceEphemeral),
    requestChanges: changes =>
      sliceStore.requestChanges(changes.map(wrapChange)),
  };
}

export interface WorkspaceParticipant {
  lastSeen: number | undefined;
  syncStates: { state: Automerge.SyncState; ephemeral: Automerge.SyncState };
}

export class WorkspaceStore<G extends SynGrammar<any, any>>
  implements SliceStore<G>
{
  get worskpace() {
    return this;
  }

  _participants: Writable<AgentPubKeyMap<WorkspaceParticipant>>;
  get participants() {
    return derived(this._participants, i => {
      const isActive = (lastSeen: number | undefined) =>
        lastSeen && Date.now() - lastSeen < this.config.hearbeatInterval * 2;
      const isIdle = (lastSeen: number | undefined) =>
        lastSeen &&
        Date.now() - lastSeen > this.config.hearbeatInterval * 2 &&
        Date.now() - lastSeen < this.config.outOfSessionTimeout;
      const isOffline = (lastSeen: number | undefined) =>
        !lastSeen || Date.now() - lastSeen > this.config.outOfSessionTimeout;

      const active = i
        .entries()
        .filter(
          ([pubkey, info]) =>
            isActive(info.lastSeen) && !isEqual(pubkey, this.myPubKey)
        )
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

  _state: Writable<Automerge.Doc<GrammarState<G>>>;
  get state() {
    return derived(this._state, i => Automerge.clone(i));
  }

  _ephemeral: Writable<Automerge.Doc<GrammarEphemeralState<G>>>;
  get ephemeral() {
    return derived(this._ephemeral, i => JSON.parse(JSON.stringify(i)));
  }

  _currentTip: Writable<EntryHash>;
  get currentTip() {
    return derived(this._currentTip, i => i);
  }

  private unsubscribe: () => void = () => {};
  private intervals: any[] = [];

  get myPubKey() {
    return this.rootStore.client.cellClient.cell.cell_id[1];
  }
  private x = 0
  private constructor(
    protected rootStore: RootStore<G>,
    protected config: SynConfig,
    public workspaceHash: EntryHash,
    currentTip: Record,
    initialParticipants: Array<AgentPubKey>
  ) {
    const { unsubscribe } = this.rootStore.client.cellClient.addSignalHandler(
      signal => {
        const synSignal: SynSignal = signal.data.payload;
        console.log("Signal ", synSignal.message.type, this.x)
        this.x+=1
        if (synSignal.message.type == "WorkspaceMessage") {
          console.log("from", serializeHash(synSignal.provenance), "for workspace", serializeHash(synSignal.message.workspace_hash ))
          const payload = synSignal.message.payload
          if (payload.type == 'Heartbeat') {
            console.log("   peeps ", payload.known_participants.map(a=>serializeHash(a)))
          } else {
            console.log("PAYLOAD", payload)
          }
        }
        if (synSignal.message.type !== 'WorkspaceMessage') return;
        if (isEqual(synSignal.provenance, this.myPubKey)) return;

        const message: WorkspaceMessage = synSignal.message;
        if (message && isEqual(message.workspace_hash, workspaceHash)) {
          if (message.payload.type === 'LeaveWorkspace') {
            this.handleLeaveWorkspaceNotice(synSignal.provenance);
            return;
          }

          if (
            message.payload.type === 'JoinWorkspace' ||
            !get(this._participants).get(synSignal.provenance)
          ) {
            this.handleNewParticipant(synSignal.provenance);
          } else {
            this._participants.update(p => {
              const participantInfo = p.get(synSignal.provenance);
              participantInfo.lastSeen = Date.now();
              p.put(synSignal.provenance, participantInfo);

              return p;
            });
          }

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
          if (message.payload.type === 'Heartbeat') {
            this.handleHeartbeat(
              synSignal.provenance,
              message.payload.known_participants
            );
          }
        }
      }
    );
    this.unsubscribe = unsubscribe;

    const heartbeatInterval = setInterval(async () => {
      const participants = await this.rootStore.client.getWorkspaceParticipants(
        workspaceHash
      );

      this._participants.update(p => {
        const newParticipants = participants.filter(
          maybeNew => !p.has(maybeNew) && !isEqual(this.myPubKey, maybeNew)
        );

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
          if (
            !info.lastSeen ||
            Date.now() - info.lastSeen > config.outOfSessionTimeout
          ) {
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
        .active.map(p => serializeHash(p))
        .sort((p1, p2) => {
          if (p1 < p2) {
            return -1;
          }
          if (p1 > p2) {
            return 1;
          }
          return 0;
        });

      if (activeParticipants[0] === serializeHash(this.myPubKey)) {
        this.commitChanges();
      }
    }, this.config.commitStrategy.CommitEveryNMs);
    this.intervals.push(commitInterval);

    const commit = decode((currentTip.entry as any).Present.entry) as Commit;
    const state = stateFromCommit(commit);

    this._state = writable(state);
    this._currentTip = writable(
      (currentTip.signed_action.hashed.content as Create).entry_hash
    );

    const participantsMap: AgentPubKeyMap<WorkspaceParticipant> =
      new AgentPubKeyMap();

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

  static async joinWorkspace<G extends SynGrammar<any, any>>(
    rootStore: RootStore<G>,
    config: SynConfig,
    workspaceHash: EntryHash
  ): Promise<WorkspaceStore<G>> {
    const output = await rootStore.client.joinWorkspace(workspaceHash);

    return new WorkspaceStore(
      rootStore,
      config,
      workspaceHash,
      output.current_tip,
      output.participants.filter(p => !isEqual(rootStore.myPubKey, p))
    );
  }

  requestChanges(changes: Array<GrammarDelta<G>>) {
    this._state.update(state => {
      let newState = state;
      this._ephemeral.update(ephemeralState => {
        let newEphemeralState = ephemeralState;

        for (const changeRequested of changes) {
          newState = Automerge.change(newState, doc => {
            newEphemeralState = Automerge.change(newEphemeralState, eph => {
              this.rootStore.grammar.applyDelta(
                changeRequested,
                doc,
                eph,
                this.myPubKey
              );
            });
          });
        }

        const stateChanges = Automerge.getChanges(state, newState);
        const ephemeralChanges = Automerge.getChanges(
          ephemeralState,
          newEphemeralState
        );

        const participants = get(this._participants).keys();

        this.rootStore.client.sendMessage(participants, {
          type: 'WorkspaceMessage',
          workspace_hash: this.workspaceHash,
          payload: {
            type: 'ChangeNotice',
            state_changes: stateChanges.map(c => encode(c) as any),
            ephemeral_changes: ephemeralChanges.map(c => encode(c) as any),
          },
        });
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
      p.put(participant, {
        ...info,
        syncStates: {
          state: nextSyncState,
          ephemeral: ephemeralNextSyncState,
        },
      });
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

      p.put(from, participantInfo);
      return p;
    });

    this.requestSync(from);
  }

  async commitChanges(meta?: any) {
    const currentTip = get(this._currentTip);
    const currentTipCommit = get(this.rootStore.knownCommits).entryMap.get(
      currentTip
    );
    if (currentTipCommit) {
      if (
        isEqual(
          decode(currentTipCommit.state) as any,
          Automerge.save(get(this._state))
        )
      ) {
        // Nothing to commit, just return
        return;
      }
    }

    if (meta) {
      meta = encode(meta);
    }

    const commit: Commit = {
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
    });

    this._currentTip.set(newCommit.entryHash);
  }

  private handleHeartbeat(_from: AgentPubKey, participants: AgentPubKey[]) {
    this._participants.update(p => {
      const newParticipants = participants.filter(
        maybeNew => !p.has(maybeNew) && !isEqual(maybeNew, this.myPubKey)
      );

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

  async leaveWorkspace(): Promise<void> {
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

  private handleNewParticipant(participant: AgentPubKey) {
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
  }

  private handleLeaveWorkspaceNotice(participant: AgentPubKey) {
    this._participants.update(p => {
      p.delete(participant);
      return p;
    });
  }
}
