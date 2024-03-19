use hc_zome_syn_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
pub fn create_document(document: Document) -> ExternResult<Record> {
    let document_hash = create_entry(EntryTypes::Document(document.clone()))?;
    create_link(
        document_hash.clone(),
        agent_info()?.agent_latest_pubkey,
        LinkTypes::DocumentToAuthors,
        (),
    )?;

    let maybe_record = get(document_hash, GetOptions::default())?;
    let record = maybe_record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))?;

    Ok(record)
}

#[hdk_extern]
pub fn get_document(document_hash: AnyDhtHash) -> ExternResult<Option<Record>> {
    get(document_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_authors_for_document(document_hash: AnyDhtHash) -> ExternResult<Vec<Link>> {
    get_links(GetLinksInput {
        base_address: document_hash.try_into()?,
        link_type: LinkTypes::DocumentToAuthors.try_into_filter()?,
        tag_prefix: None,
        get_options: GetOptions::default(),
        after: None,
        before: None,
        author: None,
    })
}
