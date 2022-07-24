import type { CellClient } from '@holochain-open-dev/cell-client';
import type {
  EntryHashB64,
  AgentPubKeyB64,
} from '@holochain-open-dev/core-types';
import { encode, decode } from '@msgpack/msgpack';

import type { SendChangeInput, SendChangeRequestInput } from './types/change';
import type { Commit, CommitInput, Content } from './types/commit';
import type { SendFolkLoreInput } from './types/folks';
import type { SendHeartbeatInput } from './types/heartbeat';
import type {
  CloseSessionInput,
  NewSessionInput,
  NotifyLeaveSessionInput,
  Session,
  SessionInfo,
} from './types/session';
import type { SendSyncRequestInput, SyncResponseInput } from './types/sync';
import { allMessageTypes, SynSignal } from './types/signal';
import { deepDecodeUint8Arrays } from './utils';

export class SynClient {
  unsubscribe: () => void = () => {};

  constructor(
    public cellClient: CellClient,
    protected handleSignal: (synSignal: SynSignal) => void,
    protected zomeName = 'syn'
  ) {
    const { unsubscribe } = cellClient.addSignalHandler(signal => {
      if (
        signal.data.payload.message &&
        allMessageTypes.includes(signal.data.payload.message.type)
      ) {
        handleSignal(deepDecodeUint8Arrays(signal.data.payload));
      }
    });

    this.unsubscribe = unsubscribe;
  }

  public close() {
    return this.unsubscribe();
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

  public async closeSession(input: CloseSessionInput): Promise<void> {
    return this.callZome('close_session', input);
  }

  public getSessions(): Promise<Record<string, Session>> {
    return this.callZome('get_sessions', null);
  }

  public notifyLeaveSession(input: NotifyLeaveSessionInput): Promise<void> {
    return this.callZome('notify_leave_session', input);
  }

  /** Content */
  public putSnapshot(content: Content): Promise<EntryHashB64> {
    return this.callZome('put_snapshot', encode(content));
  }

  public async getSnapshot(
    snapshotHash: EntryHashB64
  ): Promise<Content | undefined> {
    const content = await this.callZome('get_snapshot', snapshotHash);
    if (!content) return content;
    return decode(content);
  }

  public hashSnapshot(content: Content): Promise<EntryHashB64> {
    return this.callZome('hash_snapshot', encode(content));
  }

  /** Commits */
  public commitChanges(input: CommitInput): Promise<EntryHashB64> {
    return this.callZome('commit_changes', input);
  }

  public async getCommit(commitHash: EntryHashB64): Promise<Commit> {
    return this.callZome('get_commit', commitHash);
  }

  public async getAllCommits(): Promise<Record<string, Commit>> {
    return await this.callZome('get_all_commits', null);
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
    const input = {
      ...syncRequestInput,
      syncMessage: encode(syncRequestInput.syncMessage),
    };

    return this.callZome('send_sync_request', input);
  }

  public sendSyncResponse(syncResponseInput: SyncResponseInput): Promise<void> {
    const input = {
      ...syncResponseInput,
      syncMessage: encode(syncResponseInput.syncMessage),
    };
    /* 
    if (input.state.folkMissedLastCommit) {
      input.state.folkMissedLastCommit.commit = this.encodeCommit(
        input.state.folkMissedLastCommit.commit
      );
      input.state.folkMissedLastCommit.commitInitialSnapshot = encode(
        input.state.folkMissedLastCommit.commitInitialSnapshot
      );
    }
    if (input.state.uncommittedChanges) {
      input.state.uncommittedChanges = this.encodeChangeBundle(
        syncResponseInput.state.uncommittedChanges
      );
    } */

    return this.callZome('send_sync_response', input);
  }

  /** Changes */
  public sendChangeRequest(
    changeRequestInput: SendChangeRequestInput
  ): Promise<void> {
    const input = { ...changeRequestInput };
    input.deltas = input.deltas.map(d => encode(d)) as any;

    return this.callZome('send_change_request', input);
  }

  public sendChange(sendChangeInput: SendChangeInput): Promise<void> {
    const input = {
      ...sendChangeInput,
    };
    input.deltas = input.deltas.map(d => encode(d)) as any;
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
}
