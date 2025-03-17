mod commit;
mod document;
mod workspace;

pub use commit::*;
pub use document::*;
pub use workspace::*;

use hdi::prelude::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Document(Document),
    Workspace(Workspace),
    Commit(Commit),
}

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    TagToDocument,
    DocumentToAuthors,
    DocumentToWorkspaces,
    DocumentToCommits,
    WorkspaceToTip,
    WorkspaceToParticipant,
}

#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreRecord(_) => Ok(ValidateCallbackResult::Valid),
        FlatOp::StoreEntry(_) => Ok(ValidateCallbackResult::Valid),
        FlatOp::RegisterUpdate { .. } => Ok(ValidateCallbackResult::Valid),
        FlatOp::RegisterAgentActivity { .. } => Ok(ValidateCallbackResult::Valid),
        FlatOp::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag,
            action,
        } => match link_type {
            LinkTypes::TagToDocument => Ok(ValidateCallbackResult::Valid),
            LinkTypes::DocumentToAuthors => Ok(ValidateCallbackResult::Valid),
            LinkTypes::DocumentToWorkspaces => {
                // make sure workspace references document it is linking from
                let entry_hash = target_address
                    .into_entry_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "No action hash associated with DocumentToWorkspaces link".to_string()
                    )))?;
                let workspace_entry = must_get_entry(entry_hash)?;
                let workspace = crate::Workspace::try_from(workspace_entry)?;
                let document_hash = workspace.document_hash;
                let base_address: HoloHash<hdi::prelude::hash_type::Action> = base_address
                    .into_action_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest("Invalid base address".to_string())))?;
                if document_hash != base_address.into() {
                    return Ok(ValidateCallbackResult::Invalid(
                        "Workspace document_hash does not match the document being linked from"
                            .to_string(),
                    ));
                }
                Ok(ValidateCallbackResult::Valid)
            },
            LinkTypes::DocumentToCommits => {
                // make sure commit references document it is linking from
                let commit_action_hash = target_address
                    .into_action_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "No action hash associated with WorkspaceToTip target address".to_string()
                    )))?;
                let commit_record = must_get_valid_record(commit_action_hash)?;
                let commit: Commit = commit_record
                    .entry()
                    .to_app_option()
                    .map_err(|e| wasm_error!(e))?
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "Commit entry not found".to_string()
                    )))?;

                let document_hash = commit.document_hash;
                let base_address: HoloHash<hdi::prelude::hash_type::Action> = base_address
                    .into_action_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest("Invalid base address".to_string())))?;
                if document_hash != base_address.into() {
                    return Ok(ValidateCallbackResult::Invalid(
                        "Commit document_hash does not match the document being linked from"
                            .to_string(),
                    ));
                }
                Ok(ValidateCallbackResult::Valid)
            },
            LinkTypes::WorkspaceToTip => {
                // make sure workspace references the same document as the tip commit
                let commit_action_hash = target_address
                    .into_action_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "No action hash associated with WorkspaceToTip target address".to_string()
                    )))?;
                let commit_record = must_get_valid_record(commit_action_hash)?;
                let commit: Commit = commit_record
                    .entry()
                    .to_app_option()
                    .map_err(|e| wasm_error!(e))?
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "Commit entry not found".to_string()
                    )))?;
                let workspace_entry_hash = base_address
                    .into_entry_hash()
                    .ok_or(wasm_error!(WasmErrorInner::Guest(
                        "No entry hash associated with WorkspaceToTip base address".to_string()
                    )))?;
                let workspace_entry = must_get_entry(workspace_entry_hash)?;
                let workspace: Workspace = crate::Workspace::try_from(workspace_entry)?;
                if commit.document_hash != workspace.document_hash {
                    return Ok(ValidateCallbackResult::Invalid(
                        "Commit document_hash does not match the document_hash of the workspace being linked to"
                            .to_string(),
                    ));
                }
                Ok(ValidateCallbackResult::Valid)
            },
            LinkTypes::WorkspaceToParticipant => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterDeleteLink { .. } => Ok(ValidateCallbackResult::Valid),
        FlatOp::RegisterDelete { .. } => Ok(ValidateCallbackResult::Valid),
    }
}