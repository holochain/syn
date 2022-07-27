use hdk::prelude::*;

use crate::{SynMessage, SessionMessage, SynInput};

/// Input to the send sync req call
#[derive(Serialize, Clone, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SyncPayload {
    pub sync_message: Option<SerializedBytes>,
    pub ephemeral_sync_message: Option<SerializedBytes>,
}

#[hdk_extern]
fn request_sync(input: SynInput<SyncPayload>) -> ExternResult<()> {
    let to = AgentPubKey::from(input.to.clone());

    remote_signal(
        ExternIO::encode(SynMessage::new(
            input.session_hash.clone(),
            SessionMessage::SyncRequest(input.payload),
        ))?,
        vec![to],
    )?;
    Ok(())
}

#[hdk_extern]
fn send_sync_response(input: SynInput<SyncPayload>) -> ExternResult<()> {
    // send response signal to the participant
    remote_signal(
        ExternIO::encode(SynMessage::new(
            input.session_hash,
            SessionMessage::SyncResponse(input.payload),
        ))?,
        vec![AgentPubKey::from(input.to)],
    )?;
    Ok(())
}
