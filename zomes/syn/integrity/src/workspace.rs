use hdi::prelude::*;

/// Like a branch in git
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Workspace {
    pub document_hash: AnyDhtHash,
    pub name: String,
}
