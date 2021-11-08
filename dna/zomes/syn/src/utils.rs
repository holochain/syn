use hdk::prelude::holo_hash::*;
use hdk::prelude::*;

use crate::error::{SynError, SynResult};

pub fn element_to_entry<E: TryFrom<SerializedBytes, Error = SerializedBytesError>>(
    element: Element,
) -> SynResult<(EntryHashB64, E)> {
    let entry: E = element
        .entry()
        .to_app_option()?
        .ok_or(SynError::HashNotFound)?;
    let entry_hash = element
        .header()
        .entry_hash()
        .ok_or(SynError::HashNotFound)?;

    Ok((EntryHashB64::from(entry_hash.clone()), entry))
}
