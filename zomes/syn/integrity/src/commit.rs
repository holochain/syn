use hdi::prelude::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Commit {
  pub state: SerializedBytes,
  pub created_at: Timestamp,

  pub previous_commit_hashes: Vec<EntryHash>,

  pub authors: Vec<AgentPubKey>,
  pub witnesses: Vec<AgentPubKey>, // maybe?

  pub meta: Option<SerializedBytes>,
}

