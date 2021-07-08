use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

use crate::SignalPayload;
use crate::delta::Delta;

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct StateForSync {
    pub snapshot: EntryHashB64,
    pub commit: Option<HeaderHashB64>, // latest commit if there has been one since the snapshot
    pub commit_content_hash: EntryHashB64,
    pub deltas: Vec<Delta>, // all deltas since snapshot or that commit
}

/// Input to the send sync response call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendSyncResponseInput {
    pub participant: AgentPubKeyB64,
    pub state: StateForSync,
}

#[hdk_extern]
fn send_sync_response(input: SendSyncResponseInput) -> ExternResult<()> {
    // send response signal to the participant
    remote_signal(
        ExternIO::encode(SignalPayload::SyncResp(input.state))?,
        vec![AgentPubKey::from(input.participant)],
    )?;
    Ok(())
}

/// Input to the send sync req call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendSyncRequestInput {
    pub scribe: AgentPubKeyB64,
}

#[hdk_extern]
fn send_sync_request(input: SendSyncRequestInput) -> ExternResult<()> {
    let me = agent_info()?.agent_latest_pubkey;
    remote_signal(
        ExternIO::encode(SignalPayload::SyncReq(me.into()))?,
        vec![AgentPubKey::from(input.scribe)],
    )?;
    Ok(())
}


/// Input to the send heartbeat call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendHeartbeatInput {
    pub scribe: AgentPubKeyB64,
    pub data: String,
}

#[hdk_extern]
fn send_heartbeat(input: SendHeartbeatInput) -> ExternResult<()> {
    let me = agent_info()?.agent_latest_pubkey;
    remote_signal(
        ExternIO::encode(SignalPayload::Heartbeat((me.into(), input.data)))?,
        vec![AgentPubKey::from(input.scribe)],
    )?;
    Ok(())
}
