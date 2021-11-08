import type { CellClient } from '@holochain-open-dev/cell-client';
import type {
  EntryHashB64,
  Dictionary,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';
import { encode, decode } from '@msgpack/msgpack';
import isEqual from 'lodash-es/isEqual';

import type {
  ChangeBundle,
  EphemeralChanges,
  SendChangeInput,
  SendChangeRequestInput,
} from './types/change';
import type { Commit, CommitInput, Content } from './types/commit';
import type { SendFolkLoreInput } from './types/folks';
import type { SendHeartbeatInput } from './types/heartbeat';
import type { NewSessionInput, Session, SessionInfo } from './types/session';
import type { SendSyncRequestInput, SendSyncResponseInput } from './types/sync';
import { allMessageTypes, SynSignal } from './types/signal';
import { deepDecodeUint8Arrays } from './utils';

export class SynClient {
  unsubscribe: () => void = () => {};

  constructor(
    public cellClient: CellClient,
    protected handleSignal: (synSignal: SynSignal) => void,
    protected zomeName = 'syn'
  ) {
    cellClient
      .addSignalHandler(signal => {
        console.log(signal);
        if (
          isEqual(cellClient.cellId, signal.data.cellId) &&
          signal.data.payload.message &&
          allMessageTypes.includes(signal.data.payload.message.type)
        ) {
          handleSignal(deepDecodeUint8Arrays(signal.data.payload));
        }
      })
      .then(({ unsubscribe }) => (this.unsubscribe = unsubscribe));
  }

  public close() {
    return this.unsubscribe();
  }

  /** Content */
  public putSnapshot(content: Content): Promise<EntryHashB64> {
    return this.callZome('put_snapshot', encode(content));
  }

  public async getSnapshot(snapshotHash: EntryHashB64): Promise<Content> {
    const content = await this.callZome('get_snapshot', snapshotHash);
    return decode(content);
  }

  /** Commits */
  public commitChanges(commitInput: CommitInput): Promise<EntryHashB64> {
    const commit = {
      ...commitInput,
      commit: {
        ...commitInput.commit,
        changes: this.encodeChangeBundle(commitInput.commit.changes),
      },
    };

    return this.callZome('commit_changes', commit);
  }

  public async getCommit(commitHash: EntryHashB64): Promise<Commit> {
    const commit = await this.callZome('get_commit', commitHash);
    return this.decodeCommit(commit);
  }

  /** Hash */
  public hashSnapshot(content: Content): Promise<EntryHashB64> {
    return this.callZome('hash_snapshot', encode(content));
  }

  /** Session */
  public async getSession(sessionHash: EntryHashB64): Promise<Session> {
    return this.callZome('get_session', sessionHash);
  }

  public async newSession(
    newSessionInput: NewSessionInput
  ): Promise<SessionInfo> {
    return this.callZome('new_session', newSessionInput);
  }

  public async deleteSession(sessionHash: EntryHashB64): Promise<void> {
    return this.callZome('delete_session', sessionHash);
  }

  public getSessions(): Promise<Dictionary<Session>> {
    return this.callZome('get_sessions', null);
  }

  /** Folks */
  public getFolks(): Promise<Array<AgentPubKeyB64>> {
    return this.callZome('get_folks', null);
  }

  public sendFolkLore(sendFolkLoreInput: SendFolkLoreInput): Promise<void> {
    return this.callZome('send_folk_lore', sendFolkLoreInput);
  }

  /** Sync */
  public sendSyncRequest(
    syncRequestInput: SendSyncRequestInput
  ): Promise<void> {
    return this.callZome('send_sync_request', syncRequestInput);
  }

  public sendSyncResponse(
    syncResponseInput: SendSyncResponseInput
  ): Promise<void> {
    const missedCommits: Dictionary<any> = {};

    if (syncResponseInput.state.folkMissedLastCommit) {
      syncResponseInput.state.folkMissedLastCommit.commit = this.encodeCommit(
        syncResponseInput.state.folkMissedLastCommit.commit
      );
    }

    const input = {
      ...syncResponseInput,
      state: {
        ...syncResponseInput.state,
        missedCommits,
        uncommittedChanges: this.encodeChangeBundle(
          syncResponseInput.state.uncommittedChanges
        ),
      },
    };

    return this.callZome('send_sync_response', input);
  }

  /** Changes */
  public sendChangeRequest(
    changeRequestInput: SendChangeRequestInput
  ): Promise<void> {
    const input = { ...changeRequestInput };
    if (input.deltaChanges) {
      input.deltaChanges = {
        ...input.deltaChanges,
        deltas: input.deltaChanges.deltas.map(d => encode(d)),
      };
    }
    if (input.ephemeralChanges) {
      input.ephemeralChanges = this.encodeEphemeral(input.ephemeralChanges);
    }

    return this.callZome('send_change_request', input);
  }

  public sendChange(sendChangeInput: SendChangeInput): Promise<void> {
    const input = {
      ...sendChangeInput,
    };
    if (input.deltaChanges) {
      input.deltaChanges = this.encodeChangeBundle(input.deltaChanges);
    }
    if (input.ephemeralChanges) {
      input.ephemeralChanges = this.encodeEphemeral(input.ephemeralChanges);
    }
    return this.callZome('send_change', input);
  }

  /** Heartbeat */
  public sendHeartbeat(heartbeatInput: SendHeartbeatInput): Promise<void> {
    return this.callZome('send_heartbeat', heartbeatInput);
  }

  /** Helpers */
  private async callZome(fnName: string, payload: any): Promise<any> {
    return this.cellClient.callZome(this.zomeName, fnName, payload);
  }

  private encodeCommit(commit: Commit) {
    return {
      ...commit,
      changes: this.encodeChangeBundle(commit.changes),
    };
  }

  private encodeChangeBundle(changes: ChangeBundle) {
    return {
      ...changes,
      deltas: changes.deltas.map(d => encode(d)),
    };
  }

  private decodeCommit(commit: any): Commit {
    return {
      ...commit,
      changes: {
        deltas: commit.changes.deltas.map(d => decode(d)),
      },
    };
  }

  private encodeEphemeral(
    ephemeralChanges: EphemeralChanges
  ): Dictionary<Uint8Array> {
    const changes = {};
    for (const key of Object.keys(ephemeralChanges)) {
      changes[key] = encode(ephemeralChanges[key]);
    }
    return changes;
  }
  decodeEphemeral(
    ephemeralChanges: Dictionary<Uint8Array>
  ): EphemeralChanges {
    const changes = {};
    for (const key of Object.keys(ephemeralChanges)) {
      changes[key] = decode(ephemeralChanges[key]);
    }
    return changes;
  }
}
