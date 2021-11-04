use holo_hash::*;
use hdk::prelude::*;

use crate::{SignalPayload, SynMessage};

/// Input to the send folklore call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub enum FolkLore {
    Participants(Vec<AgentPubKeyB64>),
    Gone(Vec<AgentPubKeyB64>),
}

/// Input to the send folklore call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendFolkLoreInput {
    pub session_hash: EntryHashB64,
    pub participants: Vec<AgentPubKeyB64>,
    pub data: FolkLore,
}

#[hdk_extern]
fn send_folk_lore(input: SendFolkLoreInput) -> ExternResult<()> {
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::FolkLore(input.data),
        ))?,
        input.participants.into_iter().map(|a| a.into()).collect(),
    )?;
    Ok(())
}

#[hdk_extern]
fn get_folks(_: ()) -> ExternResult<Vec<AgentPubKeyB64>> {
    let folks_anchor_hash = get_folks_path().hash()?;
    let links = get_links(folks_anchor_hash, None)?;
    let folks = links
        .into_iter()
        .map(|l| AgentPubKey::from(l.target).into())
        .collect();
    Ok(folks)
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

/// Input to the send heartbeat call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendHeartbeatInput {
    pub session_hash: EntryHashB64,
    pub scribe: AgentPubKeyB64,
    pub data: String,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Heartbeat {
    pub from_folk: AgentPubKeyB64,
    pub data: String,
}

#[hdk_extern]
fn send_heartbeat(input: SendHeartbeatInput) -> ExternResult<()> {
    let me = agent_info()?.agent_latest_pubkey;
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::Heartbeat(Heartbeat {
                from_folk: me.into(),
                data: input.data,
            }),
        ))?,
        vec![AgentPubKey::from(input.scribe)],
    )?;
    Ok(())
}
