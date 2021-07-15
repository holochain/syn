use hdk::prelude::*;

use crate::error::{SynError, SynResult};

pub fn get_links_and_load_type<R: TryFrom<Entry>>(
    base: EntryHash,
    tag: Option<LinkTag>,
) -> SynResult<Vec<(HeaderHash, EntryHash, R)>> {
    let links = get_links(base.into(), tag)?.into_inner();

    Ok(links
        .iter()
        .map(|link| {
            if let Some(element) = get(link.target.clone(), Default::default())? {
                let e: Entry = element
                    .entry()
                    .clone()
                    .into_option()
                    .ok_or(SynError::HashNotFound)?;
                let entry: R = R::try_from(e).map_err(|_e| SynError::HashNotFound)?;
                return Ok((element.header_address().clone(), link.target.clone(), entry));
            };
            Err(SynError::HashNotFound)
        })
        .filter_map(Result::ok)
        .collect())
}
