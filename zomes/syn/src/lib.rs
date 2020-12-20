use error::SynResult;
use hdk3::prelude::*;
use link::LinkTag;
mod error;



#[derive(Debug, Serialize, Deserialize, SerializedBytes, Clone, PartialEq)]
pub struct HashString(String);

#[derive(Debug, Serialize, Deserialize, SerializedBytes, Clone, PartialEq)]
#[serde(try_from = "HashString")]
#[serde(into = "HashString")]
pub struct WrappedAgentPubKey(pub AgentPubKey);

#[derive(Debug, Serialize, Deserialize, SerializedBytes, Clone, PartialEq)]
#[serde(try_from = "HashString")]
#[serde(into = "HashString")]
pub struct WrappedHeaderHash(pub HeaderHash);

#[derive(Debug, Serialize, Deserialize, SerializedBytes, Clone, PartialEq)]
#[serde(try_from = "HashString")]
#[serde(into = "HashString")]
pub struct WrappedEntryHash(pub EntryHash);

impl TryFrom<HashString> for WrappedAgentPubKey {
    type Error = String;
    fn try_from(ui_string_hash: HashString) -> Result<Self, Self::Error> {
        match AgentPubKey::try_from(ui_string_hash.0) {
            Ok(address) => Ok(Self(address)),
            Err(e) => Err(format!("{:?}", e)),
        }
    }
}

impl From<WrappedAgentPubKey> for AgentPubKey {
    fn from(ui_string_hash: WrappedAgentPubKey) -> Self {
        return ui_string_hash.0;
    }
}

impl From<WrappedAgentPubKey> for HashString {
    fn from(wrapped_agent_pub_key: WrappedAgentPubKey) -> Self {
        Self(wrapped_agent_pub_key.0.to_string())
    }
}

impl TryFrom<HashString> for WrappedHeaderHash {
    type Error = String;
    fn try_from(ui_string_hash: HashString) -> Result<Self, Self::Error> {
        match HeaderHash::try_from(ui_string_hash.0) {
            Ok(address) => Ok(Self(address)),
            Err(e) => Err(format!("what is this error {:?}", e)),
        }
    }
}
impl From<WrappedHeaderHash> for HashString {
    fn from(wrapped_header_hash: WrappedHeaderHash) -> Self {
        Self(wrapped_header_hash.0.to_string())
    }
}

impl TryFrom<HashString> for WrappedEntryHash {
    type Error = String;
    fn try_from(ui_string_hash: HashString) -> Result<Self, Self::Error> {
        match EntryHash::try_from(ui_string_hash.0) {
            Ok(address) => Ok(Self(address)),
            Err(e) => Err(format!("{:?}", e)),
        }
    }
}
impl From<WrappedEntryHash> for HashString {
    fn from(wrapped_entry_hash: WrappedEntryHash) -> Self {
        Self(wrapped_entry_hash.0.to_string())
    }
}



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
    Content::entry_def()
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
fn put_content(content: Content) -> SynResult<HeaderHash> {
    let path = Path::from("snapshot");
    path.ensure()?;
    let header_hash = create_entry(&content)?;
    let content_hash = hash_entry(&content)?;

    // snapshot anchor base
    let snapshots_anchor_hash = path.hash()?;
    create_link(
        snapshots_anchor_hash,
        content_hash.clone(),
        SnapshotsTag::tag(),
    )?;
    Ok(header_hash)
}

// TODO better way to do this?
/// The optional content
#[derive(Serialize, Deserialize, SerializedBytes)]
pub struct OptionContent {
    result: Option<Content>,
}

#[hdk_extern]
fn get_content(input: WrappedEntryHash) -> SynResult<OptionContent> {
    let entry_hash :WrappedEntryHash = input.into();
    if let Some(element) = get(input,  GetOptions::content())? {
        Ok(OptionContent{result: element.into_inner().1.to_app_option()?})
    } else {
        Ok(OptionContent{result: None})
    }
}

///  Content Change
#[derive(Clone, Serialize, Deserialize, SerializedBytes)]
pub struct ChangeMeta {
    contributors: Vec<AgentPubKey>,
    witnesses: Vec<AgentPubKey>, // maybe?
    app_specific: SerializedBytes,
}

// Entry type for committing changes to the content, called by the clerk.
#[hdk_entry(id = "content_change")]
#[derive(Clone)]
struct ContentChange {
    deltas: Vec<SerializedBytes>,
    previous_change: EntryHash, // hash of Content on which these deltas are to be applied
    meta: ChangeMeta,
}

/// Input to the commit call
#[derive(Serialize, Deserialize, SerializedBytes)]
pub struct CommitInput {
    snapshot: EntryHash,
    change: ContentChange,
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
