use hdk::prelude::*;
use holo_hash::*;

use crate::{SignalPayload, SynMessage};

/// Input to the send sync req call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RequestSyncInput {
    pub to: AgentPubKeyB64,
    pub session_hash: EntryHashB64,
    pub sync_message: SerializedBytes,
}

#[hdk_extern]
fn request_sync(input: RequestSyncInput) -> ExternResult<()> {
    let to = AgentPubKey::from(input.to.clone());

    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::SyncRequest(input),
        ))?,
        vec![to],
    )?;
    Ok(())
}

/// Input to the send sync response call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendSyncResponseInput {
    pub participant: AgentPubKeyB64,
    pub session_hash: EntryHashB64,
    pub sync_message: SerializedBytes,
}

#[hdk_extern]
fn send_sync_response(input: SendSyncResponseInput) -> ExternResult<()> {
    // send response signal to the participant
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::SyncResponse(input.sync_message),
        ))?,
        vec![AgentPubKey::from(input.participant)],
    )?;
    Ok(())
}
