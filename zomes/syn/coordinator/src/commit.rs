use crate::utils::*;
use hc_zome_syn_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn create_commit(commit: Commit) -> ExternResult<Record> {
    let entry_hash = hash_entry(&commit)?;
    let c = EntryTypes::Commit(commit.clone());
    let _ = create_relaxed(c, commit.clone().try_into()?);

    let _ = create_link_relaxed(
        commit.document_hash,
        entry_hash.clone(),
        LinkTypes::DocumentToCommits,
        (),
    )?;

    let record = get(entry_hash, GetOptions::default())?;

    record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))
}

#[hdk_extern]
pub fn get_commit(commit_hash: EntryHash) -> ExternResult<Option<Record>> {
    get(commit_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_commits_for_document(document_hash: AnyDhtHash) -> ExternResult<Vec<EntryHash>> {
    let links = get_links(document_hash.clone(), LinkTypes::DocumentToCommits, None)?;

    let hashes: Vec<EntryHash> = links
        .into_iter()
        .filter_map(|link| EntryHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}
