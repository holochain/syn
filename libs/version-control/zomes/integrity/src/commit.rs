use hdi::prelude::*;

#[hdk_entry_helper]
pub struct Commit {
  pub previous_commit_hashes: Vec<ActionHash>,

  // hash of Content on which these deltas are to be applied
  pub previous_snapshot_hash: EntryHash,
  // hash of Content with these deltas applied
  pub new_snaphshot_hash: EntryHash,

  pub authors: Vec<AgentPubKey>,
  pub witnesses: Vec<AgentPubKey>, // maybe?
  pub app_specific: Option<SerializedBytes>,
}

