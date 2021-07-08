use hdk::prelude::holo_hash::*;
use hdk::prelude::*;

use crate::SignalPayload;

/// Input to the send folklore call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendFolkLoreInput {
    pub participants: Vec<AgentPubKeyB64>,
    pub data: String,
}

#[hdk_extern]
fn send_folk_lore(input: SendFolkLoreInput) -> ExternResult<()> {
    remote_signal(
        ExternIO::encode(SignalPayload::FolkLore(input.data))?,
        input.participants.into_iter().map(|a| a.into()).collect(),
    )?;
    Ok(())
}

#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct FolksList(Vec<AgentPubKeyB64>);

#[hdk_extern]
fn get_folks(_: ()) -> ExternResult<FolksList> {
    let folks_anchor_hash = get_folks_path().hash()?;
    let links = get_links(folks_anchor_hash, None)?.into_inner();
    let folks = links
        .into_iter()
        .map(|l| AgentPubKey::from(l.target).into())
        .collect();
    Ok(FolksList(folks))
}

pub fn register_as_folk() -> ExternResult<()> {
    // ensure folks path and link self to it

    let me = agent_info()?.agent_latest_pubkey;
    let path = get_folks_path();
    path.ensure()?;
    let folks_anchor_hash = path.hash()?;
    create_link(folks_anchor_hash, me.into(), ())?;

    Ok(())
}

fn get_folks_path() -> Path {
    Path::from("folks")
}
