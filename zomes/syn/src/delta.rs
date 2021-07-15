use std::collections::HashMap;

use hdk::prelude::holo_hash::*;
use hdk::prelude::*;

use crate::{SignalPayload, SynMessage};

/// Delta
/// change this for your app to indicate a small change in a patch-grammar
/// appropriate for your content.
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Delta(SerializedBytes);

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FolkChanges {
    pub at_folk_index: usize,
    pub session_changes: Vec<usize>,
}

/// Change struct that is sent by the scribe to participants
/// consists of a set of deltas, an and indicator of the index
/// into the list of uncommited deltas this change starts at.
/// UI's are expected to be able to receive and handle changes
/// out of order by looking at the index, and can use sync requests
/// to catch up if necessary.
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangeBundle {
    pub at_session_index: usize,
    pub deltas: Vec<Delta>,
    // AgentPubKeyB64 -> folkIndex -> sessionIndex
    pub authors: HashMap<AgentPubKeyB64, FolkChanges>,
}

/// Input to the send change call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendChangeRequestInput {
    pub session_hash: EntryHashB64,
    pub scribe: AgentPubKeyB64,
    pub at_folk_index: usize,
    pub at_session_index: usize,
    pub deltas: Vec<Delta>,
}

/// Input to the send change call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangeRequest {
    pub folk: AgentPubKeyB64,
    pub scribe: AgentPubKeyB64,
    pub at_folk_index: usize,
    pub at_session_index: usize,
    pub deltas: Vec<Delta>,
}

#[hdk_extern]
fn send_change_request(input: SendChangeRequestInput) -> ExternResult<()> {
    let scribe = AgentPubKey::from(input.scribe.clone());

    let me = AgentPubKeyB64::from(agent_info()?.agent_initial_pubkey);
    let request = ChangeRequest {
        at_folk_index: input.at_folk_index,
        at_session_index: input.at_session_index,
        deltas: input.deltas,
        folk: me,
        scribe: input.scribe,
    };

    // send response signal to the participant
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::ChangeReq(request),
        ))?,
        vec![scribe],
    )?;
    Ok(())
}

/// Input to the send change response call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendChangeInput {
    pub participants: Vec<AgentPubKeyB64>,
    pub changes: ChangeBundle,
    pub session_hash: EntryHashB64,
}

#[hdk_extern]
fn send_change(input: SendChangeInput) -> ExternResult<()> {
    let participants = input.participants.into_iter().map(|a| a.into()).collect();
    // send response signal to the participants
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::ChangeNotice(input.changes),
        ))?,
        participants,
    )?;
    Ok(())
}
