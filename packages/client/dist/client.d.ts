import type { AgentPubKey, EntryHash, Record, AppAgentClient } from '@holochain/client';
import { RecordBag, EntryRecord } from '@holochain-open-dev/utils';
import { Commit, CreateCommitInput, CreateWorkspaceInput, SynMessage, UpdateWorkspaceTipInput, Workspace } from './types';
export declare class SynClient {
    client: AppAgentClient;
    protected roleName: string;
    protected zomeName: string;
    constructor(client: AppAgentClient, roleName: string, zomeName?: string);
    /** Roots */
    createRoot(commit: Commit): Promise<EntryRecord<Commit>>;
    getAllRoots(): Promise<RecordBag<Commit>>;
    /** Commits */
    createCommit(input: CreateCommitInput): Promise<EntryRecord<Commit>>;
    getCommit(commitHash: EntryHash): Promise<EntryRecord<Commit> | undefined>;
    getCommitsForRoot(root_hash: EntryHash): Promise<RecordBag<Commit>>;
    /** Workspaces */
    createWorkspace(input: CreateWorkspaceInput): Promise<EntryRecord<Workspace>>;
    getWorkspacesForRoot(root_hash: EntryHash): Promise<RecordBag<Workspace>>;
    getWorkspaceParticipants(workspace_hash: EntryHash): Promise<Array<AgentPubKey>>;
    getWorkspaceCommits(workspaceHash: EntryHash): Promise<Record[]>;
    getWorkspaceTips(workspaceHash: EntryHash): Promise<Record[]>;
    updateWorkspaceTip(input: UpdateWorkspaceTipInput): Promise<void>;
    joinWorkspace(workspace_hash: EntryHash): Promise<AgentPubKey[]>;
    leaveWorkspace(workspace_hash: EntryHash): Promise<void>;
    sendMessage(recipients: Array<AgentPubKey>, message: SynMessage): Promise<void>;
    /** Helpers */
    private callZome;
}
