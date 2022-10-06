import { AgentPubKey, EntryHash, Record } from '@holochain/client';

export interface Commit {
  state: Uint8Array;

  created_at: number;

  previous_commit_hashes: Array<EntryHash>;

  authors: Array<AgentPubKey>;
  witnesses: Array<AgentPubKey>;

  meta: Uint8Array | undefined;
}

export interface Workspace {
  name: String;
  root_hash: EntryHash;
}

/** Client API */

export interface CreateCommitInput {
  commit: Commit;
  root_hash: EntryHash;
}
export interface CreateWorkspaceInput {
  workspace: Workspace;
  initial_tip_hash: EntryHash;
}

export interface UpdateWorkspaceTipInput {
  workspace_hash: EntryHash;
  new_tip_hash: EntryHash;
}

export interface JoinWorkspaceOutput {
  current_tip: Record;
  participants: Array<AgentPubKey>;
}
export interface SynMessage {
  recipients: Array<AgentPubKey>;
  workspace_message: WorkspaceMessage;
}

export interface WorkspaceMessage {
  workspace_hash: EntryHash;
  payload: MessagePayload;
}

export type MessagePayload =
  | {
      type: 'JoinWorkspace';
    }
  | {
      type: 'LeaveWorkspace';
    }
  | {
      type: 'ChangeNotice';
      state_changes: Uint8Array[];
      ephemeral_changes: Uint8Array[];
    }
  | {
      type: 'SyncReq';
      sync_message: Uint8Array | undefined;
      ephemeral_sync_message: Uint8Array | undefined;
    }
  | {
      type: 'Heartbeat';
      known_participants: Array<AgentPubKey>;
    };

export interface SynSignal {
  provenance: AgentPubKey;
  message: WorkspaceMessage;
}
