use hdi::prelude::*;

/// Real time session
/// The scribe is the author of the session's action
#[hdk_entry_helper]
pub struct Session {
    pub session_info: Option<SerializedBytes>, // hash of the starting state for this session
}

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
  Session(Session)
}

#[hdk_link_types]
pub enum LinkTypes {
  PathToSessions
}