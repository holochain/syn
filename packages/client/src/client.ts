import type { CellClient } from '@holochain-open-dev/cell-client';
import type { AgentPubKey, EntryHash, Record } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import {
  Commit,
  CreateCommitInput,
  CreateWorkspaceInput,
  JoinWorkspaceOutput,
  UpdateWorkspaceTipInput,
  WorkspaceMessage,
} from './types';

export class SynClient {
  constructor(public cellClient: CellClient, protected zomeName = 'syn') {}

  /** Commits */
  public createRoot(commit: Commit): Promise<Record> {
    return this.callZome('create_root', commit);
  }

  public createCommit(input: CreateCommitInput): Promise<Record> {
    return this.callZome('create_commit', input);
  }

  public async getCommit(commitHash: EntryHash): Promise<Commit | undefined> {
    const record: Record | undefined = await this.callZome(
      'get_commit',
      commitHash
    );
    if (!record) return undefined;
    const commit = decode((record.entry as any).Present.entry) as Commit;
    return commit;
  }

  public async getAllRoots(): Promise<Array<Record>> {
    return await this.callZome('get_all_roots', null);
  }

  public async getCommitsForRoot(root_hash: EntryHash): Promise<Array<Record>> {
    return await this.callZome('get_commits_for_root', root_hash);
  }

  /** Workspaces */
  public async createWorkspace(input: CreateWorkspaceInput): Promise<Record> {
    return this.callZome('create_workspace', input);
  }

  public getWorkspacesForRoot(root_hash: EntryHash): Promise<Array<Record>> {
    return this.callZome('get_workspaces_for_root', root_hash);
  }

  public getWorkspaceParticipants(
    workspace_hash: EntryHash
  ): Promise<Array<AgentPubKey>> {
    return this.callZome('get_workspace_participants', workspace_hash);
  }

  public getWorkspaceTip(workspaceHash: EntryHash): Promise<EntryHash> {
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
