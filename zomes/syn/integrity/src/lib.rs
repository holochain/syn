mod commit;
mod workspace;

pub use commit::*;
pub use workspace::*;

use hdi::prelude::*;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
  Commit(Commit),
  Workspace(Workspace),
}

#[hdk_link_types]
pub enum LinkTypes {
  PathToCommits,
  PathToWorkspaces,
  WorkspaceToTip,
  WorkspaceToParticipant,
}