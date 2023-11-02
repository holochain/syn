use hdi::prelude::*;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct Document {
    pub meta: Option<SerializedBytes>,
}
