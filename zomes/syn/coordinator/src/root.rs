use crate::{
    messages::{send_message, SendMessageInput, SynMessage},
    utils::*,
    workspace::get_workspace_participants,
};
use hc_zome_syn_integrity::*;
use hdk::prelude::*;
use itertools::Itertools;

fn all_roots_path() -> Path {
    Path::from("all_documents")
}

pub fn get_all_participants() -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(
        all_roots_path().path_entry_hash()?,
        LinkTypes::PathToRoots,
        None,
    )?;

    let roots_hashes: Vec<EntryHash> = links
        .into_iter()
        .map(|link| EntryHash::from(link.target))
        .collect();

    let mut participants: HashSet<AgentPubKey> = HashSet::new();
    for root_hash in roots_hashes {
        let links = get_links(root_hash, LinkTypes::RootToWorkspaces, None)?;
        let workspaces_hashes: Vec<EntryHash> = links
            .into_iter()
            .map(|link| EntryHash::from(link.target))
            .collect();

        for workspace_hash in workspaces_hashes {
            let p: Vec<AgentPubKey> = get_workspace_participants(workspace_hash)?;
            for agent in p {
                participants.insert(agent);
            }
        }
    }

    Ok(vec![])
}

#[hdk_extern]
pub fn create_root(root_commit: Commit) -> ExternResult<Record> {
    let entry_hash = hash_entry(&root_commit)?;
    let c = EntryTypes::Commit(root_commit.clone());
    let _ = create_relaxed(c, root_commit.clone().try_into()?);

    if !root_commit.previous_commit_hashes.is_empty() {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Root commit cannot contain any previous commit hashes".into()
        )));
    }

    let path = all_roots_path();

    let _ = create_link_relaxed(
        path.path_entry_hash()?,
        entry_hash.clone(),
        LinkTypes::PathToRoots,
        (),
    )?;

    let maybe_record = get(entry_hash, GetOptions::default())?;
    let record = maybe_record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))?;

    let mut participants: Vec<AgentPubKey> = get_all_participants()?;
    let my_pub_key = agent_info()?.agent_initial_pubkey;

    participants.retain(|agent| *agent != my_pub_key);
    send_message(SendMessageInput {
        message: SynMessage::NewRoot {
            root: record.clone(),
        },
        recipients: participants,
    })?;

    Ok(record)
}

#[hdk_extern]
pub fn get_all_roots(_: ()) -> ExternResult<Vec<Record>> {
    let links = get_links(
        all_roots_path().path_entry_hash()?,
        LinkTypes::PathToRoots,
        None,
    )?;

    let get_inputs = links
        .into_iter()
        .map(|link| link.target)
        .unique()
        .map(|target| {
            GetInput::new(
                AnyDhtHash::from(EntryHash::from(target)),
                GetOptions::default(),
            )
        })
        .collect();

    let maybe_records = HDK.with(|hdk| hdk.borrow().get(get_inputs))?;

    let records: Vec<Record> = maybe_records.into_iter().filter_map(|e| e).collect();

    Ok(records)
}
