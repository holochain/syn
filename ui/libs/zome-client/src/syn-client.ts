import type { CellClient } from '@holochain-open-dev/cell-client';
import type {
  EntryHashB64,
  HeaderHashB64,
  Dictionary,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';
import { encode, decode } from '@msgpack/msgpack';
import { isEqual } from 'lodash-es';

import type {
  ChangeBundle,
  SendChangeInput,
  SendChangeRequestInput,
} from './types/delta';
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
  public commit(commitInput: CommitInput): Promise<HeaderHashB64> {
    const commit = {
      ...commitInput,
      commit: {
        ...commitInput.commit,
        changes: this.encodeChangeBundle(commitInput.commit.changes),
      },
    };

    return this.callZome('commit', commit);
  }

  /** Hash */
  public hashContent(content: Content): Promise<EntryHashB64> {
    return this.callZome('hash_content', encode(content));
  }

  /** Session */
  public async getSession(sessionHash: EntryHashB64): Promise<SessionInfo> {
    const sessionInfo = await this.callZome('get_session', sessionHash);
    return this.decodeSessionInfo(sessionInfo);
  }

  public async newSession(
    newSessionInput: NewSessionInput
  ): Promise<SessionInfo> {
    const sessionInfo = await this.callZome('new_session', newSessionInput);
    return this.decodeSessionInfo(sessionInfo);
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

    for (const hash of Object.keys(syncResponseInput.state.missedCommits)) {
      missedCommits[hash] = this.encodeCommit(
        syncResponseInput.state.missedCommits[hash]
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
    const input = {
      ...changeRequestInput,
      deltas: changeRequestInput.deltas.map(d => encode(d)),
    };

    return this.callZome('send_change_request', input);
  }

  public sendChange(sendChangeInput: SendChangeInput): Promise<void> {
    const input = {
      ...sendChangeInput,
      changes: this.encodeChangeBundle(sendChangeInput.changes),
    };
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

  private decodeSessionInfo(sessionInfo: any): SessionInfo {
    const commits = {};

    for (const [hash, commit] of Object.entries(sessionInfo.commits)) {
      commits[hash] = this.decodeCommit(commit);
    }

    return {
      ...sessionInfo,
      commits,
      snapshot: decode(sessionInfo.snapshot),
    };
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
}
