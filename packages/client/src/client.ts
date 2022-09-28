import type { CellClient } from '@holochain-open-dev/cell-client';
import type { AgentPubKey, EntryHash, Record } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import {
  Commit,
  CreateWorkspaceInput,
  JoinWorkspaceOutput,
  UpdateWorkspaceTipInput,
  WorkspaceMessage,
} from './types';

export class SynClient {
  constructor(public cellClient: CellClient, protected zomeName = 'syn') {}

  /** Commits */
  public createCommit(commit: Commit): Promise<Record> {
    return this.callZome('create_commit', commit);
  }

  public async getCommit(commitHash: EntryHash): Promise<Commit|undefined> {
    const record: Record | undefined = await this.callZome('get_commit', commitHash);
    if (!record) return undefined
    const commit = decode((record.entry as any).Present.entry) as Commit;
    return commit
  }

  public async getAllCommits(): Promise<Array<Record>> {
    return await this.callZome('get_all_commits', null);
  }

  /** Workspaces */
  public async createWorkspace(input: CreateWorkspaceInput): Promise<Record> {
    return this.callZome('create_workspace', input);
  }

  public getAllWorkspaces(): Promise<Array<Record>> {
    return this.callZome('get_all_workspaces', null);
  }

  public getWorkspaceParticipants(
    workspace_hash: EntryHash
  ): Promise<Array<AgentPubKey>> {
    return this.callZome('get_workspace_participants', workspace_hash);
  }

  public getWorkspaceTip(
    workspaceHash: EntryHash
  ): Promise<EntryHash> {
    return this.callZome('get_workspace_tip', workspaceHash);
  }

  public updateWorkspaceTip(
    input: UpdateWorkspaceTipInput
  ): Promise<Array<Record>> {
    return this.callZome('update_workspace_tip', input);
  }

  public async joinWorkspace(
    workspace_hash: EntryHash
  ): Promise<JoinWorkspaceOutput> {
    return this.callZome('join_workspace', workspace_hash);
  }

  public async leaveWorkspace(workspace_hash: EntryHash): Promise<void> {
    return this.callZome('leave_workspace', workspace_hash);
  }

  public sendMessage(
    recipients: Array<AgentPubKey>,
    workspace_message: WorkspaceMessage
  ): Promise<void> {
    return this.callZome('send_message', {
      recipients,
      workspace_message,
    });
  }

  /** Helpers */
  private async callZome(fnName: string, payload: any): Promise<any> {
    return this.cellClient.callZome(this.zomeName, fnName, payload);
  }
}
