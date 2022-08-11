use hc_zome_syn_integrity::*;
use hdk::prelude::*;

fn all_workspaces_path() -> Path {
    Path::from("all_workspaces")
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateWorkspaceInput {
    workspace: Workspace,
    initial_tip_hash: EntryHash,
}

#[hdk_extern]
pub fn create_workspace(input: CreateWorkspaceInput) -> ExternResult<Record> {
    let entry_hash = hash_entry(&input.workspace)?;
    let action_hash = create_entry(EntryTypes::Workspace(input.workspace))?;

    create_link(
        all_workspaces_path().path_entry_hash()?,
        entry_hash.clone(),
        LinkTypes::PathToWorkspaces,
        (),
    )?;

    create_link(
        entry_hash,
        input.initial_tip_hash,
        LinkTypes::WorkspaceToTip,
        (),
    )?;

    let record = get(action_hash, GetOptions::default())?;

    record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))
}

#[hdk_extern]
pub fn get_all_workspaces(_: ()) -> ExternResult<Vec<Record>> {
    let path = all_workspaces_path();

    let links = get_links(path.path_entry_hash()?, LinkTypes::PathToWorkspaces, None)?;

    let workspaces_get_inputs = links
        .into_iter()
        .map(|l| {
            GetInput::new(
                AnyDhtHash::from(EntryHash::from(l.target)),
                GetOptions::default(),
            )
        })
        .collect();

    let maybe_workspaces_vec = HDK.with(|h| h.borrow().get(workspaces_get_inputs))?;
    let workspaces_vec: Vec<Record> = maybe_workspaces_vec.into_iter().filter_map(|r| r).collect();

    Ok(workspaces_vec)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateWorkspaceTipInput {
    workspace_hash: EntryHash,
    new_tip_hash: EntryHash,
}

#[hdk_extern]
pub fn update_workspace_tip(input: UpdateWorkspaceTipInput) -> ExternResult<()> {
    create_link(
        input.workspace_hash,
        input.new_tip_hash,
        LinkTypes::WorkspaceToTip,
        (),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_workspace_tip(workspace_hash: EntryHash) -> ExternResult<EntryHash> {
    let links = get_links(workspace_hash, LinkTypes::WorkspaceToTip, None)?;

    let maybe_latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));

    let latest_link = maybe_latest_link.ok_or(wasm_error!(WasmErrorInner::Guest(
        "This workspace doesn't have any commit associated with it".into()
    )))?;

    Ok(latest_link.target.into())
}

#[hdk_extern]
pub fn get_workspace_participants(
    workspace_hash: EntryHash,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(workspace_hash, LinkTypes::WorkspaceToParticipant, None)?;

    let participants: Vec<AgentPubKey> = links
        .into_iter()
        .map(|l| AgentPubKey::from(EntryHash::from(l.target)))
        .collect();
    Ok(participants)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JoinWorkspaceOutput {
    participants: Vec<AgentPubKey>,
    current_tip: Record,
}
#[hdk_extern]
pub fn join_workspace(workspace_hash: EntryHash) -> ExternResult<JoinWorkspaceOutput> {
    let my_pub_key = agent_info()?.agent_initial_pubkey;
    create_link(
        workspace_hash.clone(),
        my_pub_key,
        LinkTypes::WorkspaceToParticipant,
        (),
    )?;

    let participants = get_workspace_participants(workspace_hash.clone())?;
    let current_tip_hash = get_workspace_tip(workspace_hash.clone())?;

    let current_tip = get(current_tip_hash, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Can't get the current tip for the workspace".into())
    ))?;

    // Signal
    send_message(SynMessage {
        workspace_message: WorkspaceMessage {
            workspace_hash,
            payload: MessagePayload::JoinWorkspace,
        },
        recipients: participants.clone(),
    })?;

    let output = JoinWorkspaceOutput {
        participants,
        current_tip,
    };
    Ok(output)
}

#[hdk_extern]
pub fn leave_workspace(workspace_hash: EntryHash) -> ExternResult<()> {
    let my_pub_key = agent_info()?.agent_initial_pubkey;

    let links = get_links(
        workspace_hash.clone(),
        LinkTypes::WorkspaceToParticipant,
        None,
    )?;

    let my_links: Vec<Link> = links
        .clone()
        .into_iter()
        .filter(|l| AgentPubKey::from(EntryHash::from(l.target.clone())).eq(&my_pub_key))
        .collect();

    let participants: Vec<AgentPubKey> = links
        .into_iter()
        .map(|l| AgentPubKey::from(EntryHash::from(l.target.clone())))
        .filter(|agent_pub_key| !agent_pub_key.eq(&my_pub_key))
        .collect();

    for my_link in my_links {
        delete_link(my_link.create_link_hash)?;
    }

    // Signal
    send_message(SynMessage {
        workspace_message: WorkspaceMessage {
            workspace_hash,
            payload: MessagePayload::LeaveWorkspace,
        },
        recipients: participants,
    })?;

    Ok(())
}

#[derive(Serialize, Debug, Deserialize)]
#[serde(tag = "type")]
pub enum MessagePayload {
    JoinWorkspace,
    LeaveWorkspace,
    ChangeNotice{
        state_changes: Vec<SerializedBytes>,
        ephemeral_changes: Vec<SerializedBytes>
    },
    SyncReq {
        sync_message: Option<SerializedBytes>,
        ephemeral_sync_message: Option<SerializedBytes>,
    },
    Heartbeat {
        known_participants: Vec<AgentPubKey>,
    },
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WorkspaceMessage {
    workspace_hash: EntryHash,
    payload: MessagePayload,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SynMessage {
    workspace_message: WorkspaceMessage,
    recipients: Vec<AgentPubKey>,
}

#[hdk_extern]
pub fn send_message(input: SynMessage) -> ExternResult<()> {
    remote_signal(input.workspace_message, input.recipients)?;

    Ok(())
}
