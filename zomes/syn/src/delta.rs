use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

use crate::SignalPayload;

/// Delta
/// change this for your app to indicate a small change in a patch-grammar
/// appropriate for your content.  Here we are just using as plain String
/// which works if you just want to convert all your Delta's to JSON.
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Delta(String);

/// Change struct that is sent by the scribe to participants
/// consists of a set of deltas, an and indicator of the index
/// into the list of uncommited deltas this change starts at.
/// UI's are expected to be able to receive and handle changes
/// out of order by looking at the index, and can use sync requests
/// to catch up if necessary.
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct Change((u32, Vec<Delta>));

/// Input to the send change call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendChangeRequestInput {
    pub scribe: AgentPubKeyB64,
    pub change: Change,
}

#[hdk_extern]
fn send_change_request(input: SendChangeRequestInput) -> ExternResult<()> {
    // send response signal to the participant
    remote_signal(
        ExternIO::encode(SignalPayload::ChangeReq(input.change))?,
        vec![AgentPubKey::from(input.scribe)],
    )?;
    Ok(())
}

/// Input to the send change response call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendChangeInput {
    pub participants: Vec<AgentPubKeyB64>,
    pub change: Change,
}

#[hdk_extern]
fn send_change(input: SendChangeInput) -> ExternResult<()> {
    let participants = input.participants.into_iter().map(|a| a.into()).collect();
    // send response signal to the participants
    remote_signal(
        ExternIO::encode(SignalPayload::Change(input.change))?,
        participants,
    )?;
    Ok(())
}