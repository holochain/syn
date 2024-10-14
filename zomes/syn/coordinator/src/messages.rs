use hdk::prelude::*;

#[derive(Serialize, Debug, Deserialize)]
#[serde(tag = "type")]
pub enum MessagePayload {
    JoinSession,
    LeaveSession,
    ClerkAccepted,
    ImNotTheClerk {
        clerk: AgentPubKey,
    },
    SendOperationsAsClerk {
        operations: Vec<SerializedBytes>,
    },
    SendOperationsToClerk {
        operations: Vec<SerializedBytes>,
        last_known_op_index: SerializedBytes,
    },
    ValidateOperationsAsClerk {
        operations: Vec<SerializedBytes>,
    },
    ChangeNotice {
        state_changes: Vec<SerializedBytes>,
        ephemeral_changes: Vec<SerializedBytes>,
    },
    NewCommit {
        new_commit: Record,
    },
    SyncReq {
        sync_message: Option<SerializedBytes>,
        ephemeral_sync_message: Option<SerializedBytes>,
    },
    ClerkReq {
        clerk: AgentPubKey,
    },
    ClerkResp {
        clerk: AgentPubKey,
    },
    InitiateElection {
        previous_clerk: AgentPubKey,
    },
    VoteInElection {
        previous_clerk: AgentPubKey,
        nomination: AgentPubKey,
    },
    Heartbeat {
        known_participants: Vec<AgentPubKey>,
        clerk: Option<AgentPubKey>,
    },
    VoteOfNoConfidence {
        for_clerk: AgentPubKey,
    },
    RequestSyncAsNewClerk {
        last_known_op_index: SerializedBytes,
    },
    InformClerk {
        operations: Vec<SerializedBytes>,
    },
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SessionMessage {
    pub workspace_hash: EntryHash,
    pub payload: MessagePayload,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendMessageInput {
    pub message: SessionMessage,
    pub recipients: Vec<AgentPubKey>,
}

#[hdk_extern]
pub fn send_message(input: SendMessageInput) -> ExternResult<()> {
    send_remote_signal(input.message, input.recipients)?;

    Ok(())
}
