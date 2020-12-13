use hdk3::prelude::*;
use error::SynResult;

mod error;

/// Content

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
    create_link(
        snapshots_anchor_hash,
        hash.clone(),
        LinkTag::from("snapshots"), // TODO?
    )?;
    Ok(hash)
}

`#[hdk_extern]
fn get_content(input: HoloHash) -> SynResult<Option<Content>> {
    if let Some(element) = get(latest_info.target,  GetOptions::content())? {
        element.into_inner().1.to_app_option()?
    } else {
        None
    }
}

///  Content Change

type struct ChangeMeta {
    contributors: Vec<AgentPubKey>,
    witnesses: Vec<AgentPubKey>, // maybe?
    app_specific: SerializedBytes,
}

// Entry type for committing changes to the content, called by the clerk.
#[hdk_entry(id = "content_change")]
#[derive(Clone)]
type struct ContentChange {
    deltas: Vec<SerializedBytes>,
    previous_change: HoloHash, // hash of Content on which these deltas are to be applied
    meta: ChangeMeta
}

/// Input to the commit call
#[derive(Serialize, Deserialize, SerializedBytes)]
pub struct CommitInput {
    snapshot: HoloHash,
    change: ContentChange,
}

#[hdk_extern]
fn commit(input: CommitInput) -> SynResult<HeaderHash> {
    let hash = create_entry(&input.change)?;
    // snapshot anchor base
    let snapshots_anchor_hash = path.hash()?;
    let tag = LinkTag::from(input.change.previous_change.clone()),
    create_link(
        input.snapshot,
        hash.clone(),
        tag,
    )?;
    Ok(hash)
}
