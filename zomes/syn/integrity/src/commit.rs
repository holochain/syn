use hdi::prelude::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Commit {
    pub state: SerializedBytes,

    pub document_hash: AnyDhtHash,
    pub previous_commit_hashes: Vec<ActionHash>,

    pub authors: Vec<AgentPubKey>,
    pub witnesses: Vec<AgentPubKey>, // maybe?

    pub meta: Option<SerializedBytes>,
}
