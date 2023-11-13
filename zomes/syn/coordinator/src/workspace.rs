use hc_zome_syn_integrity::*;
use hdk::prelude::*;
use itertools::Itertools;

use crate::{
    messages::{send_message, MessagePayload, SendMessageInput, SessionMessage},
    utils::{create_link_relaxed, create_relaxed},
};

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateWorkspaceInput {
    workspace: Workspace,
    initial_commit_hash: EntryHash,
}

#[hdk_extern]
pub fn create_workspace(input: CreateWorkspaceInput) -> ExternResult<Record> {
    let entry_hash = hash_entry(&input.workspace)?;
    let action_hash = create_relaxed(
        EntryTypes::Workspace(input.workspace.clone()),
        input.workspace.clone().try_into()?,
    )?;

    create_link_relaxed(
        input.workspace.document_hash,
        entry_hash.clone(),
        LinkTypes::DocumentToWorkspaces,
        (),
    )?;

    create_link_relaxed(
        entry_hash,
        input.initial_commit_hash,
        LinkTypes::WorkspaceToTip,
        (),
    )?;

    let record = get(action_hash, GetOptions::default())?;

    record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))
}

#[hdk_extern]
pub fn get_workspace(workspace_hash: EntryHash) -> ExternResult<Option<Record>> {
    get(workspace_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_workspaces_for_document(document_hash: AnyDhtHash) -> ExternResult<Vec<EntryHash>> {
    let links = get_links(document_hash, LinkTypes::DocumentToWorkspaces, None)?;

    let hashes = links
        .into_iter()
        .filter_map(|l| EntryHash::try_from(l.target).ok())
        .collect();

    Ok(hashes)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateWorkspaceTipInput {
    workspace_hash: EntryHash,
    new_tip_hash: EntryHash,
    previous_commit_hashes: Vec<EntryHash>,
}

#[hdk_extern]
pub fn update_workspace_tip(input: UpdateWorkspaceTipInput) -> ExternResult<()> {
    let tag = match input.previous_commit_hashes.len() {
        0 => LinkTag::new([]),
        1 => LinkTag::new(input.previous_commit_hashes[0].as_ref()),
        _ => LinkTag::new(
            [
                input.previous_commit_hashes[0].as_ref(),
                input.previous_commit_hashes[1].as_ref(),
            ]
            .concat(),
        ),
    };
    create_link_relaxed(
        input.workspace_hash,
        input.new_tip_hash,
        LinkTypes::WorkspaceToTip,
        tag,
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_workspace_tips(workspace_hash: EntryHash) -> ExternResult<Vec<EntryHash>> {
    let links = get_links(workspace_hash, LinkTypes::WorkspaceToTip, None)?;

    let mut tips = HashSet::new();
    let mut tips_previous = HashSet::new();
    for l in links {
        tips.insert(EntryHash::try_from(l.target).map_err(|e| wasm_error!(e))?);
        if l.tag.as_ref().len() == 39 {
            tips_previous.insert(
                EntryHash::from_raw_39(l.tag.as_ref().to_vec())
                    .map_err(|e| wasm_error!("error converting link {:?}", e))?,
            );
        }
        if l.tag.as_ref().len() == 78 {
            tips_previous.insert(
                EntryHash::from_raw_39(l.tag.as_ref()[..39].to_vec())
                    .map_err(|e| wasm_error!("error converting link {:?}", e))?,
            );
            tips_previous.insert(
                EntryHash::from_raw_39(l.tag.as_ref()[39..].to_vec())
                    .map_err(|e| wasm_error!("error converting link {:?}", e))?,
            );
        }
    }
    for p in tips_previous {
        tips.remove(&p);
    }
    Ok(tips.into_iter().collect())
}

#[hdk_extern]
pub fn get_workspace_session_participants(
    workspace_hash: EntryHash,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(workspace_hash, LinkTypes::WorkspaceToParticipant, None)?;

    let participants: Vec<AgentPubKey> = links
        .into_iter()
        .filter_map(|l| AgentPubKey::try_from(l.target).ok())
        .unique()
        .collect();
    Ok(participants)
}

#[hdk_extern]
pub fn join_workspace_session(workspace_hash: EntryHash) -> ExternResult<Vec<AgentPubKey>> {
    let my_pub_key = agent_info()?.agent_initial_pubkey;
    let participants = get_workspace_session_participants(workspace_hash.clone())?;

    if !participants.contains(&my_pub_key) {
        create_link_relaxed(
            workspace_hash.clone(),
            my_pub_key,
            LinkTypes::WorkspaceToParticipant,
            (),
        )?;
        // Signal
        send_message(SendMessageInput {
            message: SessionMessage {
                workspace_hash: workspace_hash.clone(),
                payload: MessagePayload::JoinSession,
            },
            recipients: participants.clone(),
        })?;
    }

    Ok(participants)
}

#[hdk_extern]
pub fn leave_workspace_session(workspace_hash: EntryHash) -> ExternResult<()> {
    let my_pub_key = agent_info()?.agent_initial_pubkey;

    let links = get_links(
        workspace_hash.clone(),
        LinkTypes::WorkspaceToParticipant,
        None,
    )?;

    let my_links: Vec<Link> = links
        .clone()
        .into_iter()
        .filter(|l| {
            AgentPubKey::try_from(l.target.clone())
                .map(|agent| agent == my_pub_key)
                .unwrap_or(false)
        })
        //        .filter(|l| AgentPubKey::from(EntryHash::from(l.target.clone())).eq(&my_pub_key))
        .collect();

    let participants: Vec<AgentPubKey> = links
        .into_iter()
        .filter_map(|l: Link| AgentPubKey::try_from(l.target).ok())
        .filter(|agent_pub_key| !agent_pub_key.eq(&my_pub_key))
        .collect();

    for my_link in my_links {
        delete_link(my_link.create_link_hash)?;
    }

    // Signal
    send_message(SendMessageInput {
        message: SessionMessage {
            workspace_hash: workspace_hash.clone(),
            payload: MessagePayload::LeaveSession,
        },
        recipients: participants.clone(),
    })?;

    Ok(())
}
