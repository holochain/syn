use hc_zome_syn_integrity::*;
use hdk::prelude::*;

pub fn create_relaxed(entry_type: EntryTypes, entry: Entry) -> ExternResult<ActionHash> {
    HDK.with(|h| {
        let index = ScopedEntryDefIndex::try_from(&entry_type)?;
        let vis = EntryVisibility::from(&entry_type);

        h.borrow().create(CreateInput::new(
            index,
            vis,
            entry,
            // This is used to test many conductors thrashing creates between
            // each other so we want to avoid retries that make the test take
            // a long time.
            ChainTopOrdering::Relaxed,
        ))
    })
}

pub fn create_link_relaxed<T, E>(
    base_address: impl Into<AnyLinkableHash>,
    target_address: impl Into<AnyLinkableHash>,
    link_type: T,
    tag: impl Into<LinkTag>,
) -> ExternResult<ActionHash>
where
    ScopedLinkType: TryFrom<T, Error = E>,
    WasmError: From<E>,
{
    let ScopedLinkType {
        zome_index,
        zome_type: link_type,
    } = link_type.try_into()?;
    HDK.with(|h| {
        h.borrow().create_link(CreateLinkInput::new(
            base_address.into(),
            target_address.into(),
            zome_index,
            link_type,
            tag.into(),
            ChainTopOrdering::Relaxed,
        ))
    })
}

pub fn delete_link_relaxed(address: ActionHash) -> ExternResult<ActionHash> {
    HDK.with(|h| {
        h.borrow()
            .delete_link(DeleteLinkInput::new(address, ChainTopOrdering::Relaxed))
    })
}

pub fn do_get_links(base: impl Into<AnyLinkableHash>, link_type: impl LinkTypeFilterExt) -> ExternResult<Vec<Link>> {
    let input = GetLinksInputBuilder::try_new(base, link_type)?.build();
    get_links(input)
}