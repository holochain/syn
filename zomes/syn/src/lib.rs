use error::SynResult;
use hdk3::prelude::*;
use link::LinkTag;
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
    Content::entry_def(),
    ContentChange::entry_def()
];

/// A easy way to create the tag
pub(crate) struct SnapshotsTag;

impl SnapshotsTag {
    const TAG: &'static [u8; 4] = b"snap";

    /// Create the tag
    pub(crate) fn tag() -> LinkTag {
        LinkTag::new(*Self::TAG)
    }
}

// Used by the clerk to commit a snapshot of the content and link it to
// the snapshot anchor.
#[hdk_extern]
fn put_content(content: Content) -> SynResult<EntryHash> {
    let path = Path::from("snapshot");
    path.ensure()?;
    let _header_hash = create_entry(&content)?;
    let content_hash = hash_entry(&content)?;

    // snapshot anchor base
    let snapshots_anchor_hash = path.hash()?;
    create_link(
        snapshots_anchor_hash,
        content_hash.clone(),
        SnapshotsTag::tag(),
    )?;
    Ok(content_hash)
}

/// The optional content
#[derive(Serialize, Deserialize, SerializedBytes)]
pub struct OptionContent(Option<Content>);

#[hdk_extern]
fn get_content(input: EntryHash) -> SynResult<OptionContent> {
    if let Some(element) = get(input,  GetOptions::content())? {
        Ok(OptionContent(element.into_inner().1.to_app_option()?))
    } else {
        Ok(OptionContent(None))
    }
}


///  Content Change
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct ChangeMeta {
    contributors: Vec<AgentPubKey>,
    witnesses: Vec<AgentPubKey>, // maybe?
    app_specific: Option<SerializedBytes>,
}

// Entry type for committing changes to the content, called by the clerk.
#[hdk_entry(id = "content_change")]
#[derive(Clone, Debug)]
pub struct ContentChange {
    pub deltas: Vec<SerializedBytes>,
    pub previous_change: EntryHash, // hash of Content on which these deltas are to be applied
    meta: ChangeMeta,
}

/// Input to the commit call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct CommitInput {
    pub snapshot: EntryHash,
    pub change: ContentChange,
}


#[hdk_extern]
fn commit(input: CommitInput) -> SynResult<HeaderHash> {
    let header_hash = create_entry(&input.change)?;
    let change_hash = hash_entry(&input.change)?;
    let bytes: SerializedBytes = input.change.previous_change.try_into()?;
    let tag = LinkTag::from(bytes.bytes().to_vec());
    create_link(
        input.snapshot,
        change_hash.clone(),
        tag,
    )?;
    Ok(header_hash)
}

#[hdk_extern]
fn hash_content(content: Content) -> SynResult<EntryHash> {
    let hash = hash_entry(&content)?;
    Ok(hash)
}
