use crate::utils::*;
use hc_zome_syn_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn create_commit(commit: Commit) -> ExternResult<Record> {
    let c = EntryTypes::Commit(commit.clone());
    let action_hash = create_relaxed(c, commit.clone().try_into()?)?;

    let _ = create_link_relaxed(
        commit.document_hash,
        action_hash.clone(),
        LinkTypes::DocumentToCommits,
        (),
    )?;

    let record = get(action_hash, GetOptions::default())?;

    record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))
}

#[hdk_extern]
pub fn get_commit(commit_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(commit_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_commits_for_document(document_hash: AnyDhtHash) -> ExternResult<Vec<Link>> {
    do_get_links(document_hash.clone(), LinkTypes::DocumentToCommits)
}
