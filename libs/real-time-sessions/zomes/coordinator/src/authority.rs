use hc_zome_real_time_sessions_integrity::*;
use hdk::prelude::*;

use crate::{all_sessions_path, message::SessionMessage};

#[hdk_extern]
pub fn create_session(session_info: Option<SerializedBytes>) -> ExternResult<Record> {
    let action_hash = create_entry(EntryTypes::Session(Session { session_info }))?;

    create_link(
        all_sessions_path().path_entry_hash()?,
        action_hash.clone(),
        LinkTypes::PathToSessions,
        (),
    )?;

    let record = get(action_hash, GetOptions::default())?;

    record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))
}

#[hdk_extern]
pub fn close_session(action_hash: ActionHash) -> ExternResult<()> {
    delete_entry(action_hash)?;

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BroadcastMessageInput {
    participants: Vec<AgentPubKey>,
    message: SessionMessage,
}

#[hdk_extern]
pub fn broadcast_message_to_participants(input: BroadcastMessageInput) -> ExternResult<()> {
    remote_signal(ExternIO::encode(input.message), input.participants)?;

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendMessageToParticipant {
    participant: AgentPubKey,
    message: SessionMessage,
}
#[hdk_extern]
pub fn send_message_to_participant(input: SendMessageToParticipant) -> ExternResult<()> {
    remote_signal(ExternIO::encode(input.message), vec![input.participant])?;

    Ok(())
}
