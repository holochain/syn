use hdk::prelude::*;
use holo_hash::*;

use crate::{SignalPayload, SynMessage};

/// Input to the send sync req call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendSyncRequestInput {
    pub scribe: AgentPubKeyB64,
    pub session_hash: EntryHashB64,
    pub sync_message: SerializedBytes,
}

/// Input to the send sync req call
#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RequestSyncInput {
    pub scribe: AgentPubKeyB64,
    pub folk: AgentPubKeyB64,
    pub sync_message: SerializedBytes,
}

#[hdk_extern]
fn send_sync_request(input: SendSyncRequestInput) -> ExternResult<()> {
    let scribe = AgentPubKey::from(input.scribe.clone());
    let me = AgentPubKeyB64::from(agent_info()?.agent_initial_pubkey);

    let request_sync = RequestSyncInput {
        scribe: input.scribe,
        folk: me,
        sync_message: input.sync_message,
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
            SynMessage::SyncResp(input.sync_message),
        ))?,
        vec![AgentPubKey::from(input.participant)],
    )?;
    Ok(())
}
