import type {
  AgentPubKey,
  EntryHash,
  Record,
  AppAgentClient,
  AppAgentCallZomeRequest,
} from '@holochain/client';
import { RecordBag, EntryRecord } from '@holochain-open-dev/utils';

import {
  Commit,
  CreateCommitInput,
  CreateWorkspaceInput,
  SendMessageInput,
  SynMessage,
  UpdateWorkspaceTipInput,
  Workspace,
} from './types';

export class SynClient {
  constructor(
    public client: AppAgentClient,
    protected roleName: string,
    protected zomeName = 'syn'
  ) {}

  /** Roots */
  public async createRoot(commit: Commit): Promise<EntryRecord<Commit>> {
    const record: Record = await this.callZome('create_root', commit);
    return new EntryRecord(record);
  }

  public async getAllRoots(): Promise<RecordBag<Commit>> {
    const roots = await this.callZome('get_all_roots', null);
    return new RecordBag(roots);
  }

  /** Commits */
  public async createCommit(
    input: CreateCommitInput
  ): Promise<EntryRecord<Commit>> {
    const record: Record = await this.callZome('create_commit', input);
    return new EntryRecord(record);
  }

  public async getCommit(
    commitHash: EntryHash
  ): Promise<EntryRecord<Commit> | undefined> {
    const record: Record | undefined = await this.callZome(
      'get_commit',
      commitHash
    );
    if (!record) return undefined;

    return new EntryRecord(record);
  }

  public async getCommitsForRoot(
    root_hash: EntryHash
  ): Promise<RecordBag<Commit>> {
    const commits = await this.callZome('get_commits_for_root', root_hash);
    return new RecordBag(commits);
  }

  /** Workspaces */
  public async createWorkspace(
    input: CreateWorkspaceInput
  ): Promise<EntryRecord<Workspace>> {
    const record: Record = await this.callZome('create_workspace', input);
    return new EntryRecord(record);
  }

  public async getWorkspacesForRoot(
    root_hash: EntryHash
  ): Promise<RecordBag<Workspace>> {
    const workspaces = await this.callZome(
      'get_workspaces_for_root',
      root_hash
    );
    return new RecordBag(workspaces);
  }

  public getWorkspaceParticipants(
    workspace_hash: EntryHash
  ): Promise<Array<AgentPubKey>> {
    return this.callZome('get_workspace_participants', workspace_hash);
  }

  public getWorkspaceCommits(workspaceHash: EntryHash): Promise<Record[]> {
    return this.callZome('get_workspace_commits', workspaceHash);
  }

  public getWorkspaceTips(workspaceHash: EntryHash): Promise<Record[]> {
    return this.callZome('get_workspace_tips', workspaceHash);
  }


  public updateWorkspaceTip(input: UpdateWorkspaceTipInput): Promise<void> {
    return this.callZome('update_workspace_tip', input);
  }

  public async joinWorkspace(
    workspace_hash: EntryHash
  ): Promise<AgentPubKey[]> {
    return this.callZome('join_workspace', workspace_hash);
  }

  public async leaveWorkspace(workspace_hash: EntryHash): Promise<void> {
    return this.callZome('leave_workspace', workspace_hash);
  }

  public sendMessage(
    recipients: Array<AgentPubKey>,
    message: SynMessage
  ): Promise<void> {
    return this.callZome('send_message', {
      recipients,
      message,
    } as SendMessageInput);
  }

  /** Helpers */
  private async callZome(fnName: string, payload: any): Promise<any> {
    const req: AppAgentCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: fnName,
      payload,
    };
    return this.client.callZome(req);
  }
}
