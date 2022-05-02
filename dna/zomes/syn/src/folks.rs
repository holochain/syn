use std::collections::BTreeMap;

use hdk::prelude::*;
use holo_hash::*;

use crate::{SignalPayload, SynLinkType, SynMessage};

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FolkInfo {
    last_seen: u64,
}

pub type FolkLore = BTreeMap<AgentPubKeyB64, FolkInfo>;

/// Input to the send folklore call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendFolkLoreInput {
    pub session_hash: EntryHashB64,
    pub participants: Vec<AgentPubKeyB64>,
    pub folk_lore: FolkLore,
}

#[hdk_extern]
fn send_folk_lore(input: SendFolkLoreInput) -> ExternResult<()> {
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::FolkLore(input.folk_lore),
        ))?,
        input.participants.into_iter().map(|a| a.into()).collect(),
    )?;
    Ok(())
}

#[hdk_extern]
fn get_folks(_: ()) -> ExternResult<Vec<AgentPubKeyB64>> {
    let folks_anchor_hash = get_folks_path().path_entry_hash()?;
    let links = get_links(folks_anchor_hash.into(), None)?;
    let folks = links
        .into_iter()
        .map(|l| AgentPubKey::from(EntryHash::from(l.target)).into())
        .collect();
    Ok(folks)
}

pub fn register_as_folk() -> ExternResult<()> {
    // ensure folks path and link self to it

    let me = agent_info()?.agent_latest_pubkey;
    let path = get_folks_path();
    path.ensure()?;
    let folks_anchor_hash = path.path_entry_hash()?;
    create_link(
        folks_anchor_hash.into(),
        me.into(),
        SynLinkType::PathToFolk,
        (),
    )?;

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
