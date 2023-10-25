import type {
  AgentPubKey,
  EntryHash,
  Record,
  AppAgentClient,
} from '@holochain/client';
import { EntryRecord, ZomeClient } from '@holochain-open-dev/utils';

import {
  Commit,
  CreateCommitInput,
  CreateWorkspaceInput,
  SendMessageInput,
  SynMessage,
  SynSignal,
  UpdateWorkspaceTipInput,
  Workspace,
} from './types';

export class SynClient extends ZomeClient<SynSignal> {
  constructor(
    public client: AppAgentClient,
    public roleName: string,
    public zomeName = 'syn'
  ) {
    super(client, roleName, zomeName);
  }

  /** Roots */
  public async createRoot(commit: Commit): Promise<EntryRecord<Commit>> {
    const record: Record = await this.callZome('create_root', commit);
    return new EntryRecord(record);
  }

  public async getAllRoots(): Promise<Array<EntryRecord<Commit>>> {
    const roots: Record[] = await this.callZome('get_all_roots', null);
    return roots.map(r => new EntryRecord(r));
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
  ): Promise<Array<EntryRecord<Commit>>> {
    const commits: Record[] = await this.callZome(
      'get_commits_for_root',
      root_hash
    );
    return commits.map(c => new EntryRecord(c));
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
  ): Promise<Array<EntryRecord<Workspace>>> {
    const workspaces = await this.callZome(
      'get_workspaces_for_root',
      root_hash
    );
    return workspaces.map((w: Record) => new EntryRecord(w));
  }

  public async getWorkspaceCommits(
    workspaceHash: EntryHash
  ): Promise<Array<EntryRecord<Commit>>> {
    const records = await this.callZome('get_workspace_commits', workspaceHash);
    return records.map(r => new EntryRecord(r));
  }

  public async getWorkspaceTips(
    workspaceHash: EntryHash
  ): Promise<Array<EntryRecord<Commit>>> {
    const records = await this.callZome('get_workspace_tips', workspaceHash);
    return records.map(r => new EntryRecord(r));
  }

  public updateWorkspaceTip(input: UpdateWorkspaceTipInput): Promise<void> {
    return this.callZome('update_workspace_tip', input);
  }

  public getWorkspaceSessionParticipants(
    workspace_hash: EntryHash
  ): Promise<Array<AgentPubKey>> {
    return this.callZome('get_workspace_session_participants', workspace_hash);
  }

  public getWorkspaceEditors(
    workspace_hash: EntryHash
  ): Promise<Array<AgentPubKey>> {
    return this.callZome('get_workspace_editors', workspace_hash);
  }

  public async joinWorkspaceSession(
    workspace_hash: EntryHash
  ): Promise<AgentPubKey[]> {
    return this.callZome('join_workspace_session', workspace_hash);
  }

  public async leaveWorkspaceSession(workspace_hash: EntryHash): Promise<void> {
    return this.callZome('leave_workspace_session', workspace_hash);
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
}
