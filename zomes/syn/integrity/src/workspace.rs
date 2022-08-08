use hdi::prelude::*;

/// Like a branch in git
#[hdk_entry_helper]
pub struct Workspace {
  pub name: String,
  pub meta: Option<SerializedBytes>, // App info
}