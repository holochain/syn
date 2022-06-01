use std::collections::BTreeMap;

use hdk::prelude::*;
use holo_hash::*;

use crate::{SignalPayload, SynMessage};

/// Delta
/// change this for your app to indicate a small change in a patch-grammar
/// appropriate for your content.
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Delta(SerializedBytes);

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AuthoredDelta {
    pub delta: Delta,
    pub author: AgentPubKeyB64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FolkChanges {
    pub at_folk_index: usize,
    pub commit_changes: Vec<usize>,
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
    pub deltas: Vec<AuthoredDelta>,
    // AgentPubKeyB64 -> folkIndex -> deltaIndexInCommit
    pub authors: BTreeMap<AgentPubKeyB64, FolkChanges>,
}

/// Input to the send change call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendChangeRequestInput {
    pub session_hash: EntryHashB64,
    pub scribe: AgentPubKeyB64,

    pub last_delta_seen: LastDeltaSeen,

    pub delta_changes: DeltaChanges,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeltaChanges {
    pub at_folk_index: usize,
    pub deltas: Vec<Delta>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LastDeltaSeen {
    pub commit_hash: Option<EntryHashB64>,
    pub delta_index_in_commit: usize,
}

/// Input to the send change call
#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChangeRequest {
    pub folk: AgentPubKeyB64,
    pub scribe: AgentPubKeyB64,

    pub last_delta_seen: LastDeltaSeen,

    pub delta_changes: DeltaChanges,
}

#[hdk_extern]
fn send_change_request(input: SendChangeRequestInput) -> ExternResult<()> {
    let scribe = AgentPubKey::from(input.scribe.clone());

    let me = AgentPubKeyB64::from(agent_info()?.agent_initial_pubkey);
    let request = ChangeRequest {
        folk: me,
        scribe: input.scribe,
        last_delta_seen: input.last_delta_seen,
        delta_changes: input.delta_changes,
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
    pub session_hash: EntryHashB64,

    pub last_delta_seen: LastDeltaSeen,

    pub delta_changes: ChangeBundle,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChangeNotice {
    pub last_delta_seen: LastDeltaSeen,

    pub delta_changes: ChangeBundle,
}

#[hdk_extern]
fn send_change(input: SendChangeInput) -> ExternResult<()> {
    let participants: Vec<AgentPubKeyB64> =
        input.participants.into_iter().map(|a| a.into()).collect();

    let signal = SignalPayload::new(
        input.session_hash,
        SynMessage::ChangeNotice(ChangeNotice {
            last_delta_seen: input.last_delta_seen,
            delta_changes: input.delta_changes,
        }),
    );

    send_signal(participants, signal)
}

fn send_signal(participants: Vec<AgentPubKeyB64>, signal: SignalPayload) -> ExternResult<()> {
    let zome_name = zome_info()?.name;

    let call_inputs = participants
        .clone()
        .into_iter()
        .map(|p| {
            Call::new(
                CallTarget::NetworkAgent(p.into()),
                zome_name.clone(),
                "receive_change".into(),
                None,
                ExternIO::encode(signal.clone()).unwrap(),
            )
        })
        .collect();

    // send response signal to the participants
    let responses = HDK.with(|hdk| hdk.borrow().call(call_inputs))?;

    let mut participants_left: Vec<AgentPubKeyB64> = Vec::new();

    for (index, response) in responses.into_iter().enumerate() {
        match response {
            ZomeCallResponse::Ok(_) => {}
            _ => participants_left.push(participants[index].clone()),
        }
    }

    match participants_left.len() {
        0 => Ok(()),
        _ => send_signal(participants_left, signal),
    }
}

#[hdk_extern]
fn receive_change(signal: SignalPayload) -> ExternResult<()> {
    debug!("Received remote signal {:?}", signal);
    Ok(emit_signal(&signal)?)
}
