use hdk::prelude::*;
use holo_hash::*;

use crate::{SessionMessage, SignalPayload, SynInput, SynMessage};

/// Delta
/// change this for your app to indicate a small change in a patch-grammar
/// appropriate for your content.
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Delta(SerializedBytes);

/// Input to the send change call
#[derive(Serialize, Clone, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangeRequestPayload {
    pub state_changes: Vec<Delta>,
    pub ephemeral_changes: Vec<Delta>,
}

#[hdk_extern]
fn send_change_request(input: SynInput<ChangeRequestPayload>) -> ExternResult<()> {
    let scribe = AgentPubKey::from(input.to.clone());

    // send response signal to the participant
    remote_signal(
        ExternIO::encode(SynMessage::new(
            input.session_hash,
            SessionMessage::ChangeReq(input.payload),
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

    pub state_changes: Vec<Delta>,
    pub ephemeral_changes: Vec<Delta>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChangeNotice {
    pub state_changes: Vec<Delta>,
    pub ephemeral_changes: Vec<Delta>,
}

#[hdk_extern]
fn send_change(input: SendChangeInput) -> ExternResult<()> {
    let participants: Vec<AgentPubKeyB64> =
        input.participants.into_iter().map(|a| a.into()).collect();

    let signal = SignalPayload::new(
        input.session_hash,
        SessionMessage::ChangeNotice(ChangeNotice {
            deltas: input.deltas,
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
