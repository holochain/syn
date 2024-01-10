use std::collections::HashMap;

use hc_zome_syn_integrity::*;
use hdk::prelude::*;
use itertools::Itertools;

use crate::{
    messages::{send_message, MessagePayload, SendMessageInput, SessionMessage},
    utils::{create_link_relaxed, create_relaxed, delete_link_relaxed, do_get_links},
};

#[derive(Serialize, Deserialize, Debug, SerializedBytes)]
pub struct DocumentToWorkspaceTag {
    workspace_name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateWorkspaceInput {
    workspace: Workspace,
    initial_commit_hash: Option<ActionHash>,
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
        SerializedBytes::try_from(DocumentToWorkspaceTag {
            workspace_name: input.workspace.name,
        })
        .map_err(|err| wasm_error!(err))?
        .bytes()
        .clone(),
    )?;

    if let Some(commit_hash) = input.initial_commit_hash {
        let tag = SerializedBytes::try_from(PreviousCommitsTag(vec![]))
            .map_err(|err| wasm_error!(err))?;
        create_link_relaxed(
            entry_hash,
            commit_hash,
            LinkTypes::WorkspaceToTip,
            tag.bytes().clone(),
        )?;
    }

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
pub fn get_workspaces_for_document(document_hash: AnyDhtHash) -> ExternResult<Vec<Link>> {
    do_get_links(document_hash, LinkTypes::DocumentToWorkspaces)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateWorkspaceTipInput {
    workspace_hash: EntryHash,
    new_tip_hash: ActionHash,
    previous_commit_hashes: Vec<ActionHash>,
}

#[derive(Serialize, Deserialize, Debug, SerializedBytes)]
pub struct PreviousCommitsTag(pub Vec<ActionHash>);

#[hdk_extern]
pub fn update_workspace_tip(input: UpdateWorkspaceTipInput) -> ExternResult<()> {
    let tag = SerializedBytes::try_from(PreviousCommitsTag(input.previous_commit_hashes.clone()))
        .map_err(|err| wasm_error!(err))?;

    create_link_relaxed(
        input.workspace_hash,
        input.new_tip_hash,
        LinkTypes::WorkspaceToTip,
        tag.bytes().clone(),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_workspace_tips(workspace_hash: EntryHash) -> ExternResult<Vec<Link>> {
    let links = do_get_links(workspace_hash, LinkTypes::WorkspaceToTip)?;

    let mut tips: HashMap<ActionHash, Link> = HashMap::new();
    let mut tips_previous = HashSet::new();
    for l in links {
        tips.insert(
            ActionHash::try_from(l.target.clone()).map_err(|e| wasm_error!(e))?,
            l.clone(),
        );

        let previous_commit_hashes = PreviousCommitsTag::try_from(SerializedBytes::from(
            UnsafeBytes::from(l.tag.clone().into_inner()),
        ))
        .map_err(|err| wasm_error!(err))?;

        for previous_commit_hash in previous_commit_hashes.0 {
            tips_previous.insert(previous_commit_hash);
        }
    }
    for p in tips_previous {
        tips.remove(&p);
    }
    Ok(tips.into_values().collect())
}

#[hdk_extern]
pub fn get_workspace_session_participants(workspace_hash: EntryHash) -> ExternResult<Vec<Link>> {
    do_get_links(workspace_hash, LinkTypes::WorkspaceToParticipant)
}

#[hdk_extern]
pub fn join_workspace_session(workspace_hash: EntryHash) -> ExternResult<Vec<AgentPubKey>> {
    let my_pub_key = agent_info()?.agent_initial_pubkey;
    let participants_links = get_workspace_session_participants(workspace_hash.clone())?;

    let participants: Vec<AgentPubKey> = participants_links
        .into_iter()
        .filter_map(|l| AgentPubKey::try_from(l.target).ok())
        .unique()
        .collect();

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

    let links = do_get_links(
        workspace_hash.clone(),
        LinkTypes::WorkspaceToParticipant,
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
        delete_link_relaxed(my_link.create_link_hash)?;
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
