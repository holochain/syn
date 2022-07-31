use hc_zome_real_time_sessions_integrity::*;
use hdk::prelude::*;

use crate::{all_sessions_path, message::SessionMessage};

#[hdk_extern]
pub fn get_active_sessions(_: ()) -> ExternResult<Vec<Record>> {
    let path = all_sessions_path();

    let links = get_links(path.path_entry_hash()?, LinkTypes::PathToSessions, None)?;

    let sessions_get_inputs = links
        .into_iter()
        .map(|l| GetInput::new(AnyDhtHash::from(l.target), GetOptions::default()))
        .collect();

    let maybe_sessions_vec = HDK.with(|h| h.borrow().get(sessions_get_inputs))?;
    let sessions_vec: Vec<Record> = maybe_sessions_vec.into_iter().filter_map(|r| r).collect();

    Ok(sessions_vec)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendMessageToAutority {
    authority: AgentPubKey,
    message: SessionMessage,
}

#[hdk_extern]
pub fn send_message_to_authority(input: SendMessageToAutority) -> ExternResult<()> {
    remote_signal(ExternIO::encode(input.message), vec![input.authority])?;

    Ok(())
}
