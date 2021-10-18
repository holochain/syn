use holo_hash::*;
use hdk::prelude::*;

use crate::error::SynResult;

/// Content
// This is structure holds the shared content that is being collaboratively
// edited by participants in the happ
#[hdk_entry(id = "content")]
#[derive(Clone, Default)]
pub struct Content(SerializedBytes);

pub fn put_snapshot_inner(content: Content) -> SynResult<(HeaderHashB64, EntryHashB64)> {
    let header_hash = create_entry(&content)?;
    let content_hash = hash_entry(&content)?;

    let path = get_snapshots_path();
    path.ensure()?;

    // snapshot anchor base
    let snapshots_anchor_hash = path.hash()?;
    create_link(snapshots_anchor_hash, content_hash.clone(), ())?;
    Ok((header_hash.into(), content_hash.into()))
}

// Used by the clerk to commit a snapshot of the content and link it to
// the snapshot anchor.
#[hdk_extern]
pub fn put_snapshot(content: Content) -> ExternResult<EntryHashB64> {
    let (_, content_hash) = put_snapshot_inner(content)?;
    Ok(content_hash)
}

#[hdk_extern]
pub fn get_snapshot(input: EntryHashB64) -> ExternResult<Option<Content>> {
    if let Some(element) = get(EntryHash::from(input), GetOptions::content())? {
        Ok(element.into_inner().1.to_app_option()?)
    } else {
        Ok(None)
    }
}

#[hdk_extern]
fn hash_content(content: Content) -> ExternResult<EntryHashB64> {
    let hash = hash_entry(&content)?;
    Ok(hash.into())
}

fn get_snapshots_path() -> Path {
    Path::from("snapshots")
}
