use crate::snapshot::Snapshot;

use hdk::prelude::*;
use holo_hash::*;

use crate::change::{ChangeBundle, LastDeltaSeen};
use crate::commit::Commit;
use crate::{SignalPayload, SynMessage};

/// Input to the send sync req call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendSyncRequestInput {
    pub scribe: AgentPubKeyB64,
    pub session_hash: EntryHashB64,
    pub last_delta_seen: Option<LastDeltaSeen>,
}

/// Input to the send sync req call
#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RequestSyncInput {
    pub scribe: AgentPubKeyB64,
    pub folk: AgentPubKeyB64,
    pub last_delta_seen: Option<LastDeltaSeen>,
}

#[hdk_extern]
fn send_sync_request(input: SendSyncRequestInput) -> ExternResult<()> {
    let scribe = AgentPubKey::from(input.scribe.clone());
    let me = AgentPubKeyB64::from(agent_info()?.agent_initial_pubkey);

    let request_sync = RequestSyncInput {
        scribe: input.scribe,
        folk: me,
        last_delta_seen: input.last_delta_seen,
    };

    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::SyncReq(request_sync),
        ))?,
        vec![scribe],
    )?;
    Ok(())
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MissedCommit {
    commit_hash: EntryHashB64,
    commit: Commit,
    commit_initial_snapshot: Snapshot,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StateForSync {
    pub folk_missed_last_commit: Option<MissedCommit>,

    pub uncommitted_changes: ChangeBundle,
    // Result of applying all these deltas to the current content
    // pub current_content_hash: EntryHashB64
}

/// Input to the send sync response call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendSyncResponseInput {
    pub participant: AgentPubKeyB64,
    pub session_hash: EntryHashB64,
    pub state: StateForSync,
}

#[hdk_extern]
fn send_sync_response(input: SendSyncResponseInput) -> ExternResult<()> {
    // send response signal to the participant
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::SyncResp(input.state),
        ))?,
        vec![AgentPubKey::from(input.participant)],
    )?;
    Ok(())
}
