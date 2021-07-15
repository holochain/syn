import type { CellClient } from "@holochain-open-dev/cell-client";
import type {
  EntryHashB64,
  HeaderHashB64,
  AgentPubKeyB64,
} from "@holochain-open-dev/core-types";
import { encode, decode } from "@msgpack/msgpack";
import { isEqual } from "lodash-es";

import type { SendChangeInput, SendChangeRequestInput } from "./types/delta";
import type { Commit, CommitInput, Content } from "./types/commit";
import type { SendFolkLoreInput } from "./types/folks";
import type { SendHeartbeatInput } from "./types/heartbeat";
import type { NewSessionInput, SessionInfo } from "./types/session";
import type { SendSyncRequestInput, SendSyncResponseInput } from "./types/sync";
import { allMessageTypes, SynSignal } from "./types/signal";
import { deepDecodeUint8Arrays } from "./utils";

export class SynClient {
  constructor(
    public cellClient: CellClient,
    protected handleSignal: (synSignal: SynSignal) => void,
    protected zomeName = "syn"
  ) {
    cellClient.addSignalHandler((signal) => {
      if (
        isEqual(cellClient.cellId, signal.data.cellId) &&
        signal.data.payload.type &&
        allMessageTypes.includes(signal.data.payload.type)
      ) {
        handleSignal(deepDecodeUint8Arrays(signal.data.payload));
      }
    });
  }

  /** Content */
  public putSnapshot(content: Content): Promise<EntryHashB64> {
    return this.callZome("put_snapshot", encode(content));
  }

  public async getSnapshot(snapshotHash: EntryHashB64): Promise<Content> {
    const content = await this.callZome("get_snapshot", snapshotHash);
    return decode(content);
  }

  /** Commits */
  public commit(commitInput: CommitInput): Promise<HeaderHashB64> {
    const commit = {
      ...commitInput,
      commit: this.encodeCommit(commitInput.commit),
    };

    return this.callZome("commit", commit);
  }

  /** Hash */
  public hashContent(content: Content): Promise<EntryHashB64> {
    return this.callZome("hash_content", encode(content));
  }

  /** Session */
  public async getSession(sessionHash: EntryHashB64): Promise<SessionInfo> {
    const sessionInfo = await this.callZome("get_session", sessionHash);
    return this.decodeSessionInfo(sessionInfo);
  }

  public async newSession(
    newSessionInput: NewSessionInput
  ): Promise<SessionInfo> {
    const sessionInfo = await this.callZome("new_session", newSessionInput);
    return this.decodeSessionInfo(sessionInfo);
  }

  public getSessions(): Promise<Array<EntryHashB64>> {
    return this.callZome("get_sessions", null);
  }

  /** Folks */
  public getFolks(): Promise<Array<AgentPubKeyB64>> {
    return this.callZome("get_folks", null);
  }

  public sendFolkLore(sendFolkLoreInput: SendFolkLoreInput): Promise<void> {
    return this.callZome("send_folk_lore", {
      ...sendFolkLoreInput,
      data: JSON.stringify(sendFolkLoreInput.data),
    });
  }

  /** Sync */
  public sendSyncRequest(
    syncRequestInput: SendSyncRequestInput
  ): Promise<void> {
    return this.callZome("send_sync_request", syncRequestInput);
  }

  public sendSyncResponse(
    syncResponseInput: SendSyncResponseInput
  ): Promise<void> {
    return this.callZome("send_sync_response", syncResponseInput);
  }

  /** Changes */
  public sendChangeRequest(
    changeRequestInput: SendChangeRequestInput
  ): Promise<void> {
    return this.callZome("send_change_request", changeRequestInput);
  }

  public sendChange(sendChangeInput: SendChangeInput): Promise<void> {
    return this.callZome("send_change", sendChangeInput);
  }

  /** Heartbeat */
  public sendHeartbeat(heartbeatInput: SendHeartbeatInput): Promise<void> {
    return this.callZome("send_heartbeat", heartbeatInput);
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
      changes: {
        ...commit.changes,
        deltas: commit.changes.deltas.map((d) => encode(d)),
      },
    };
  }

  private decodeCommit(commit: any): Commit {
    return {
      ...commit,
      changes: {
        deltas: commit.changes.deltas.map((d) => decode(d)),
      },
    };
  }
}
