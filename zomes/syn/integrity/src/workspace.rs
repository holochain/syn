use hdi::prelude::*;

/// Like a branch in git
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Workspace {
    pub name: String,
    pub document_hash: AnyDhtHash,
}
