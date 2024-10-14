import { ActionCommittedSignal } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  AnyDhtHash,
  EntryHash,
  Record,
} from '@holochain/client';

export interface Document {
  initial_state: Uint8Array;
  meta: Uint8Array | undefined;
}

export interface Commit {
  state: Uint8Array;

  document_hash: AnyDhtHash;

  previous_commit_hashes: Array<ActionHash>;

  authors: Array<AgentPubKey>;
  witnesses: Array<AgentPubKey>;

  meta: Uint8Array | undefined;
}

export interface Workspace {
  name: string;
  document_hash: EntryHash;
}

/** Client API */

export interface SendMessageInput {
  recipients: Array<AgentPubKey>;
  message: SessionMessage;
}

export interface SessionMessage {
  workspace_hash: EntryHash;
  payload: MessagePayload;
}

export type MessagePayload =
  | {
      type: 'JoinSession';
    }
  | {
      type: 'LeaveSession';
    }
  | {
    type: 'ClerkAccepted';
  }
  | {
    type: 'ImNotTheClerk';
    clerk: AgentPubKey;
  }
  | {
      type: 'NewCommit';
      new_commit: Record;
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
    type: 'ClerkReq';
    clerk: AgentPubKey;
  }
  | {
    type: 'ClerkResp';
    clerk: AgentPubKey;
  }
  // | {
  //   type: 'InitiateNoConfidence';
  //   clerk: AgentPubKey;
  // }
  | {
    type: 'VoteOfNoConfidence';
    for_clerk: AgentPubKey;
  }
  | {
    type: 'InitiateElection';
    previous_clerk: AgentPubKey;
  }
  | {
    type: 'VoteInElection';
    previous_clerk: AgentPubKey;
    nomination: AgentPubKey;
  }
  | {
      type: 'Heartbeat';
      known_participants: Array<AgentPubKey>;
      clerk?: AgentPubKey;
    }
  | {
      type: 'SendOperationsToClerk';
      operations: Uint8Array[];
      last_known_op_index: Uint8Array;
  }
  | {
      type: 'ValidateOperationsAsClerk';
      operations: Uint8Array[];
  }
  | {
      type: 'SendOperationsAsClerk';
      operations: Uint8Array[];
  }
  | {
    type: 'RequestSyncAsNewClerk';
    last_known_op_index: Uint8Array;
  }
  | {
    type: 'InformClerk';
    operations: Uint8Array[];
  }
  ;

export type EntryTypes =
  | ({
      type: 'Commit';
    } & Commit)
  | ({
      type: 'Document';
    } & Document)
  | ({
      type: 'Workspace';
    } & Workspace);

export type LinkTypes =
  | 'TagToDocument'
  | 'DocumentToWorkspaces'
  | 'DocumentToCommits'
  | 'WorkspaceToTip'
  | 'WorkspaceToParticipant';

export type SynSignal =
  | {
      type: 'SessionMessage';
      provenance: AgentPubKey;
      message: SessionMessage;
    }
  | ActionCommittedSignal<EntryTypes, LinkTypes>;
