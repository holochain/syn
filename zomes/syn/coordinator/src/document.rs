use hc_zome_syn_integrity::*;
use hdk::prelude::*;

use crate::utils::*;

#[hdk_extern]
pub fn create_document(document: Document) -> ExternResult<Record> {
    let d = EntryTypes::Document(document.clone());
    let document_hash = create_relaxed(d, document.clone().try_into()?)?;

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
