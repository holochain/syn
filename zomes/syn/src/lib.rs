use hdk3::prelude::*;
use error::SynResult;

mod error;


// This is structure holds the shared content that is being collaboratively
// edited by participants in the happ
#[hdk_entry(id = "content")]
#[derive(Clone)]
pub struct Content {
    title: String,
    body: String,
}

entry_defs![
    Path::entry_def(),
    Node::entry_def()
];


// Used by the clerk to commit a snapshot of the content and link it to
// the snapshot anchor.
#[hdk_extern]
fn put_content(input: Content) -> SynResult<HeaderHash> {
    Path::from("snapshot").ensure()?;
    let hash = create_entry(&input.content)?;
    // snapshot anchor base
    let snapshots_anchor_hash = path.hash()?;
    // UseTurn the reply to and timestamp into a link tag
    let tag = LastSeenKey::new(parent_hash_entry, message.created_at);
    create_link(
        snapshots_anchor_hash,
        hash.clone(),
        LinkTag::from(hash.clone()),
    )?;
    Ok(hash)
}

#[hdk_extern]
fn get_content(input: HoloHash) -> SynResult<Option<Content>> {
    if let Some(element) = get(latest_info.target,  GetOptions::content())? {
        element.into_inner().1.to_app_option()?
    } else {
        None
    }
}
