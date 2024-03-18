use hc_zome_syn_integrity::*;
use hdk::prelude::*;

use crate::{document::get_authors_for_document, utils::*};

#[hdk_extern]
pub fn create_commit(commit: Commit) -> ExternResult<Record> {
    let c = EntryTypes::Commit(commit.clone());
    let action_hash = create_relaxed(c, commit.clone().try_into()?)?;

    let current_authors_links = get_authors_for_document(commit.document_hash.clone())?;

    let current_authors: Vec<AgentPubKey> = current_authors_links
        .into_iter()
        .filter_map(|link| link.target.into_agent_pub_key())
        .collect();

    for author in commit.authors {
        if !current_authors.contains(&author) {
            create_link_relaxed(
                commit.document_hash.clone(),
                author,
                LinkTypes::DocumentToAuthors,
                (),
            )?;
        }
    }

    let record = get(action_hash, GetOptions::default())?;

    record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LinkDocumentToCommitInput {
    pub document_hash: AnyDhtHash,
    pub commit_hash: ActionHash,
}

#[hdk_extern]
pub fn link_document_to_commit(input: LinkDocumentToCommitInput) -> ExternResult<()> {
    create_link_relaxed(
        input.document_hash.clone(),
        input.commit_hash,
        LinkTypes::DocumentToCommits,
        (),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_commit(commit_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(commit_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_commits_for_document(document_hash: AnyDhtHash) -> ExternResult<Vec<Link>> {
    do_get_links(document_hash.clone(), LinkTypes::DocumentToCommits)
}
