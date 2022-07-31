mod commit;
mod snapshot;

pub use commit::*;
pub use snapshot::*;

use hdi::prelude::*;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
  Commit(Commit),
  Snapshot(Snapshot)
}

#[hdk_link_types]
pub enum LinkTypes {
  PathToCommits
}