import { AgentPubKey, AnyDhtHash, EntryHash } from '@holochain/client';

export interface Document {
  meta: Uint8Array | undefined;
}

export interface Commit {
  state: Uint8Array;

  document_hash: AnyDhtHash;

  previous_commit_hashes: Array<EntryHash>;

  authors: Array<AgentPubKey>;
  witnesses: Array<AgentPubKey>;

  meta: Uint8Array | undefined;
}

export interface Workspace {
  name: String;
  document_hash: EntryHash;
}

/** Client API */

export type SynMessage = { type: 'WorkspaceMessage' } & SessionMessage;

export interface SendMessageInput {
  recipients: Array<AgentPubKey>;
  message: SynMessage;
}

export interface SessionMessage {
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
  message: SynMessage;
}
