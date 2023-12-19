use hdi::prelude::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Document {
    pub initial_state: SerializedBytes,
    pub meta: Option<SerializedBytes>,
}
