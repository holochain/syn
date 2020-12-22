use error::SynResult;
use hdk3::prelude::*;
use link::LinkTag;
mod error;

entry_defs![
    Path::entry_def(),
    Content::entry_def(),
    ContentChange::entry_def(),
    Session::entry_def()
];


/// Content
// This is structure holds the shared content that is being collaboratively
// edited by participants in the happ
#[hdk_entry(id = "content")]
#[derive(Clone, Debug, Default)]
pub struct Content {
    title: String,
    body: String,
}

/// Session
/// This entry holds the record of who the scribe is and a hash
/// of the content at the start of the session
/// the scribe will always be the author of the session
#[hdk_entry(id = "session")]
struct Session {
    snapshot: HeaderHash,  // hash of the starting state for this session
}

fn put_content_inner(content: Content) -> SynResult<(HeaderHash, EntryHash)> {
    let path = Path::from("snapshot");
    path.ensure()?;
    let header_hash = create_entry(&content)?;
    let content_hash = hash_entry(&content)?;

    // snapshot anchor base
    let snapshots_anchor_hash = path.hash()?;
    create_link(
        snapshots_anchor_hash,
        content_hash.clone(),
        (),
    )?;
    Ok((header_hash, content_hash))
}

// Used by the clerk to commit a snapshot of the content and link it to
// the snapshot anchor.
#[hdk_extern]
pub fn put_content(content: Content) -> SynResult<EntryHash> {
    let (_, content_hash) = put_content_inner(content)?;
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

///  Session Info need to start working in a session
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SessionInfo {
    session: HeaderHash,
    scribe: AgentPubKey,
    content: Content,
}

fn create_session(session: Session) -> SynResult<HeaderHash> {
    let path = Path::from("session");
    path.ensure()?;
    let header_hash = create_entry(&session)?;
    let session_hash = hash_entry(&session)?;

    let session_anchor_hash = path.hash()?;
    create_link(
        session_anchor_hash,
        session_hash,
        (),
    )?;

    Ok(header_hash)
}

#[hdk_extern]
fn join_session(_: ()) -> SynResult<SessionInfo> {

    // get recent sessions

    // see if there's an active one

    // fall back to other users

    // can't find a session so make one ourself
    // 1. find the Content we will make our session off of
    // TODO
    // 2. can't find a Content assume null content and commit it
    let content = Content::default();
    let (header_hash, _content_hash) = put_content_inner(content.clone())?;

    let scribe = agent_info()?.agent_latest_pubkey;
    let session = Session {
        snapshot: header_hash,
    };
    let session_hash = create_session(session)?;

    Ok(SessionInfo{
        scribe,
        session: session_hash,
        content,
    })
}
