import {
  Commit,
  SynClient,
  WorkspaceMessage,
  SynSignal,
} from '@holochain-syn/client';
import { Readable, writable, Writable } from 'svelte/store';
import { derived, get } from 'svelte/store';
import { AgentPubKeyMap } from '@holochain-open-dev/utils';
import { decode, encode } from '@msgpack/msgpack';
import {
  BinaryDocument,
  change,
  BinarySyncMessage,
  Doc,
  generateSyncMessage,
  getChanges,
  init,
  initSyncState,
  applyChanges,
  load,
  receiveSyncMessage,
  BinaryChange,
  SyncState,
  save,
} from 'automerge';
import { AgentPubKey, Create, EntryHash, Record } from '@holochain/client';
import isEqual from 'lodash-es/isEqual';

import type {
  GrammarState,
  GrammarDelta,
  SynGrammar,
  GrammarEphemeralState,
} from './grammar';

import { SynConfig } from './config';

export interface SliceStore<G extends SynGrammar<any, any>> {
  worskpace: WorkspaceStore<any>;

  state: Readable<Doc<GrammarState<G>>>;
  ephemeral: Readable<Doc<GrammarEphemeralState<G>>>;

  requestChanges(changes: Array<GrammarDelta<G>>): void;
}

export function extractSlice<
  G1 extends SynGrammar<any, any>,
  G2 extends SynGrammar<any, any>
>(
  sliceStore: SliceStore<G1>,
  wrapChange: (change: GrammarDelta<G2>) => GrammarDelta<G1>,
  sliceState: (state: Doc<GrammarState<G1>>) => Doc<GrammarState<G2>>,
  sliceEphemeral: (
    ephemeralState: Doc<GrammarEphemeralState<G1>>
  ) => Doc<GrammarEphemeralState<G2>>
): SliceStore<G2> {
  return {
    worskpace: sliceStore.worskpace as WorkspaceStore<G1>,
    state: derived(sliceStore.state, sliceState),
    ephemeral: derived(sliceStore.ephemeral, sliceEphemeral),
    requestChanges: changes => changes.map(wrapChange),
  };
}

export interface WorkspaceParticipant {
  lastSeen: number | undefined;
  syncStates: { state: SyncState; ephemeral: SyncState };
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
        .filter(([_, info]) => isActive(info.lastSeen))
        .map(([pubkey, _]) => pubkey);
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

  _state: Writable<Doc<GrammarState<G>>>;
  get state() {
    return derived(this._state, i => i);
  }

  _ephemeral: Writable<Doc<GrammarEphemeralState<G>>>;
  get ephemeral() {
    return derived(this._ephemeral, i => i);
  }

  _currentTip: Writable<EntryHash>;
  get currentTip() {
    return derived(this._currentTip, i => i);
  }

  private unsubscribe: () => void = () => {};
  private interval;

  get myPubKey() {
    return this.client.cellClient.cell.cell_id[1];
  }

  private constructor(
    protected client: SynClient,
    protected grammar: G,
    protected config: SynConfig,
    public workspaceHash: EntryHash,
    currentTip: Record,
    initialParticipants: Array<AgentPubKey>
  ) {
    const { unsubscribe } = this.client.cellClient.addSignalHandler(signal => {
      const synSignal: SynSignal = signal.data.payload;
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
            message.payload.state_changes.map(c => decode(c) as BinaryChange),
            message.payload.ephemeral_changes.map(
              c => decode(c) as BinaryChange
            )
          );
        }
        if (message.payload.type === 'SyncReq') {
          this.handleSyncRequest(
            synSignal.provenance,
            message.payload.sync_message
              ? (decode(message.payload.sync_message) as BinarySyncMessage)
              : undefined,
            message.payload.ephemeral_sync_message
              ? (decode(
                  message.payload.ephemeral_sync_message
                ) as BinarySyncMessage)
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
    });
    this.unsubscribe = unsubscribe;

    this.interval = setInterval(async () => {
      const participants = await this.client.getWorkspaceParticipants(
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
              state: initSyncState(),
              ephemeral: initSyncState(),
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
          this.client.sendMessage(p.keys(), {
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

    const commit = decode((currentTip.entry as any).Present.entry) as Commit;
    const commitState = decode(commit.state) as BinaryDocument;

    const state = load(commitState);

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
          state: initSyncState(),
          ephemeral: initSyncState(),
        },
      });
    }

    this._participants = writable(participantsMap);

    this._ephemeral = writable(init());

    for (const p of initialParticipants) {
      this.requestSync(p);
    }
  }

  static async joinWorkspace<G extends SynGrammar<any, any>>(
    client: SynClient,
    grammar: G,
    config: SynConfig,
    workspaceHash: EntryHash
  ): Promise<WorkspaceStore<G>> {
    const output = await client.joinWorkspace(workspaceHash);

    return new WorkspaceStore(
      client,
      grammar,
      config,
      workspaceHash,
      output.current_tip,
      output.participants
    );
  }

  requestChanges(changes: Array<GrammarDelta<G>>) {
    this._state.update(state => {
      let newState = state;
      this._ephemeral.update(ephemeralState => {
        let newEphemeralState = ephemeralState;

        for (const changeRequested of changes) {
          newState = change(newState, doc => {
            newEphemeralState = change(newEphemeralState, eph => {
              this.grammar.applyDelta(changeRequested, doc, eph, this.myPubKey);
            });
          });
        }

        const stateChanges = getChanges(state, newState);
        const ephemeralChanges = getChanges(ephemeralState, newEphemeralState);

        const participants = get(this._participants).keys();

        this.client.sendMessage(participants, {
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
    stateChanges: BinaryChange[],
    ephemeralChanges: BinaryChange[]
  ) {
    let thereArePendingChanges = false;

    this._state.update(state => {
      const stateChangesInfo = applyChanges(state, stateChanges);

      thereArePendingChanges =
        thereArePendingChanges || stateChangesInfo[1].pendingChanges > 0;

      return stateChangesInfo[0];
    });

    this._ephemeral.update(ephemeral => {
      const ephemeralChangesInfo = applyChanges(ephemeral, ephemeralChanges);

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

    const [nextSyncState, syncMessage] = generateSyncMessage(
      get(this._state),
      syncStates.state
    );
    const [ephemeralNextSyncState, ephemeralSyncMessage] = generateSyncMessage(
      get(this._ephemeral),
      syncStates.ephemeral
    );

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
      this.client.sendMessage([participant], {
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
    syncMessage: BinarySyncMessage | undefined,
    ephemeralSyncMessage: BinarySyncMessage | undefined
  ) {
    this._participants.update(p => {
      const participantInfo = p.get(from);

      if (syncMessage) {
        this._state.update(state => {
          const [nextDoc, nextSyncState, _message] = receiveSyncMessage(
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
          const [nextDoc, nextSyncState, _message] = receiveSyncMessage(
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
    if (meta) {
      meta = encode(meta);
    }

    const newCommit = await this.client.createCommit({
      authors: get(this._participants).keys(),
      meta,
      previous_commit_hashes: [get(this._currentTip)],
      state: save(this._state),
      witnesses: [],
    });

    this._currentTip.set(
      (newCommit.signed_action.hashed.content as Create).entry_hash
    );
  }

  private handleHeartbeat(_from: AgentPubKey, participants: AgentPubKey[]) {
    this._participants.update(p => {
      const newParticipants = participants.filter(maybeNew => !p.has(maybeNew));

      for (const newParticipant of newParticipants) {
        p.put(newParticipant, {
          lastSeen: undefined,
          syncStates: {
            state: initSyncState(),
            ephemeral: initSyncState(),
          },
        });

        this.requestSync(newParticipant);
      }

      return p;
    });
  }

  async leaveWorkspace(): Promise<void> {
    await this.client.leaveWorkspace(this.workspaceHash);
    this.unsubscribe();
    clearInterval(this.interval);
  }

  private handleNewParticipant(participant: AgentPubKey) {
    this._participants.update(p => {
      p.put(participant, {
        lastSeen: Date.now(),
        syncStates: {
          state: initSyncState(),
          ephemeral: initSyncState(),
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
