import { Commit, SessionMessage } from '@holochain-syn/client';
import {
  AgentPubKeyMap,
  HashType,
  RecordBag,
  retype,
} from '@holochain-open-dev/utils';
import {
  Readable,
  get,
  derived,
  Writable,
  writable,
  sliceAndJoin,
} from '@holochain-open-dev/stores';
import { decode, encode } from '@msgpack/msgpack';
import Automerge from 'automerge';
import {
  encodeHashToBase64,
  AgentPubKey,
  Create,
  EntryHash,
  Record,
} from '@holochain/client';
import isEqual from 'lodash-es/isEqual.js';
import { toPromise } from '@holochain-open-dev/stores';

import type {
  GrammarState,
  GrammarDelta,
  SynGrammar,
  GrammarEphemeralState,
} from './grammar.js';

import { SynConfig } from './config.js';
import { stateFromCommit } from './syn-store.js';
import { WorkspaceStore } from './workspace-store.js';

export interface SliceStore<G extends SynGrammar<any, any>> {
  myPubKey: AgentPubKey;

  workspace: SessionStore<any>;

  state: Readable<GrammarState<G>>;
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
    workspace: sliceStore.workspace as SessionStore<G1>,
    state: derived(sliceStore.state, sliceState),
    ephemeral: derived(sliceStore.ephemeral, sliceEphemeral),
    requestChanges: changes =>
      sliceStore.requestChanges(changes.map(wrapChange)),
  };
}

export interface SessionParticipant {
  lastSeen: number | undefined;
  syncStates: { state: Automerge.SyncState; ephemeral: Automerge.SyncState };
}

export class SessionStore<G extends SynGrammar<any, any>>
  implements SliceStore<G>
{
  get workspace() {
    return this;
  }

  _participants: Writable<AgentPubKeyMap<SessionParticipant>>;
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

  _state: Writable<Automerge.Doc<GrammarState<G>>>;
  get state(): Readable<GrammarState<G>> {
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
    return this.synClient.client.myPubKey;
  }

  get synClient() {
    return this.workspaceStore.documentStore.synStore.client;
  }

  private constructor(
    protected workspaceStore: WorkspaceStore<G>,
    protected config: SynConfig,
    currentTip: Record,
    initialParticipants: Array<AgentPubKey>
  ) {
    const workspaceHash = this.workspaceStore.workspaceHash;
    this.unsubscribe = this.synClient.onSignal(synSignal => {
      if (synSignal.type !== 'SessionMessage') return;
      if (isEqual(synSignal.provenance, this.myPubKey)) return;

      const message: SessionMessage = synSignal.message;
      if (
        message &&
        isEqual(message.workspace_hash, workspaceStore.workspaceHash)
      ) {
        if (message.payload.type === 'LeaveSession') {
          this.handleLeaveSessionNotice(synSignal.provenance);
          return;
        }

        if (message.payload.type === 'NewCommit') {
          this._currentTip.set(message.payload.new_commit_hash);
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
    });

    const heartbeatInterval = setInterval(async () => {
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

    const commit = decode((currentTip.entry as any).Present.entry) as Commit;
    const state = stateFromCommit(commit);

    this._state = writable(state);
    this._currentTip = writable(
      (currentTip.signed_action.hashed.content as Create).entry_hash
    );

    const participantsMap: AgentPubKeyMap<SessionParticipant> =
      new AgentPubKeyMap();

    for (const p of initialParticipants) {
      participantsMap.set(p, {
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

  static async joinSession<G extends SynGrammar<any, any>>(
    workspaceStore: WorkspaceStore<G>,
    config: SynConfig
  ): Promise<SessionStore<G>> {
    const participants =
      await workspaceStore.documentStore.synStore.client.joinWorkspaceSession(
        workspaceStore.workspaceHash
      );

    const commitsLinks =
      await workspaceStore.documentStore.synStore.client.getWorkspaceTips(
        workspaceStore.workspaceHash
      );
    const commits = await toPromise(
      sliceAndJoin(
        workspaceStore.documentStore.commits,
        commitsLinks.map(l => l.target)
      )
    );
    const commitBag = new RecordBag<Commit>(
      Array.from(commits.values()).map(er => er.record)
    );

    const tips = commitBag.entryMap;

    if (tips.size === 0)
      throw new Error("Couldn't find any tips for this workspace.");

    let currentTipHash = commitBag.entryActions.get(
      Array.from(tips.keys())[0]
    )[0];
    let currentTip: Record = commitBag.entryRecord(currentTipHash)!.record;

    // If there are more that one tip, merge them
    if (tips.size > 1) {
      let mergeState = Automerge.merge(
        Automerge.load(decode(Array.from(tips.values())[0].state) as any),
        Automerge.load(decode(Array.from(tips.values())[1].state) as any)
      );

      for (let i = 2; i < tips.size; i++) {
        mergeState = Automerge.merge(
          mergeState,
          Automerge.load(decode(Array.from(tips.values())[i].state) as any)
        );
      }

      const documentHash = workspaceStore.documentStore.documentHash;

      const commit: Commit = {
        authors: [workspaceStore.documentStore.synStore.client.client.myPubKey],
        meta: encode('Merge commit'),
        previous_commit_hashes: Array.from(tips.keys()),
        state: encode(Automerge.save(mergeState)),
        witnesses: [],
        document_hash: documentHash,
      };

      const newCommit =
        await workspaceStore.documentStore.synStore.client.createCommit(commit);

      currentTip = newCommit.record;

      await workspaceStore.documentStore.synStore.client.updateWorkspaceTip(
        newCommit.entryHash,
        workspaceStore.workspaceHash,
        Array.from(tips.keys())
      );
    }

    return new SessionStore(
      workspaceStore,
      config,
      currentTip,
      participants.filter(
        p =>
          workspaceStore.documentStore.synStore.client.client.myPubKey.toString() !==
          p.toString()
      )
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
              this.workspaceStore.documentStore.grammar.applyDelta(
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

  async commitChanges(meta?: any) {
    const currentTip = get(this._currentTip);
    const currentTipCommit = await toPromise(
      this.workspaceStore.documentStore.commits.get(currentTip)
    );
    if (currentTipCommit) {
      if (
        isEqual(
          decode(currentTipCommit.entry.state) as any,
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
      authors: [
        ...Array.from(get(this._participants).keys()),
        this.synClient.client.myPubKey,
      ],
      meta,
      previous_commit_hashes: [currentTip],
      state: encode(Automerge.save(get(this._state))),
      witnesses: [],
      document_hash: this.workspaceStore.documentStore.documentHash,
    };

    const newCommit = await this.synClient.createCommit(commit);

    await this.synClient.updateWorkspaceTip(
      this.workspaceStore.workspaceHash,
      newCommit.entryHash,
      [currentTip]
    );

    this._currentTip.set(newCommit.entryHash);
    this.workspaceStore.documentStore.synStore.client.sendMessage(
      Array.from(get(this._participants).keys()),
      {
        workspace_hash: this.workspaceStore.workspaceHash,
        payload: {
          type: 'NewCommit',
          new_commit_hash: newCommit.entryHash,
        },
      }
    );
  }

  private handleHeartbeat(_from: AgentPubKey, participants: AgentPubKey[]) {
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
          },
        });

        this.requestSync(newParticipant);
      }

      return p;
    });
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
  }

  private handleNewParticipant(participant: AgentPubKey) {
    this._participants.update(p => {
      p.set(participant, {
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

  private handleLeaveSessionNotice(participant: AgentPubKey) {
    this._participants.update(p => {
      p.delete(participant);
      return p;
    });
  }
}
