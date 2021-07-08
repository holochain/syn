use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

use crate::error::SynResult;

/// Content
// This is structure holds the shared content that is being collaboratively
// edited by participants in the happ
#[hdk_entry(id = "content")]
#[derive(Clone, Default)]
pub struct Content(SerializedBytes);


pub fn put_content_inner(content: Content) -> SynResult<(HeaderHashB64, EntryHashB64)> {
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
pub fn put_content(content: Content) -> ExternResult<EntryHashB64> {
    let (_, content_hash) = put_content_inner(content)?;
    Ok(content_hash)
}

/// The optional content
#[derive(Serialize, Deserialize, Debug)]
pub struct OptionContent(Option<Content>);

#[hdk_extern]
fn get_content(input: EntryHashB64) -> ExternResult<OptionContent> {
    if let Some(element) = get(EntryHash::from(input), GetOptions::content())? {
        Ok(OptionContent(element.into_inner().1.to_app_option()?))
    } else {
        Ok(OptionContent(None))
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