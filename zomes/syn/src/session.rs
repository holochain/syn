use std::collections::HashMap;

use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

use crate::commit::ContentChange;
use crate::content::{Content, put_content_inner};
use crate::delta::Delta;
use crate::error::{SynError, SynResult};
use crate::utils::get_links_and_load_type;

/// Session
/// This entry holds the record of who the scribe is and a hash
/// of the content at the start of the session
/// the scribe will always be the author of the session
#[hdk_entry(id = "session")]
pub struct Session {
    pub snapshot: HeaderHashB64, // hash of the starting state for this session
                                 // scribe:  // scribe will always be the author of the session, look in the header
}

///  Session Info needed to start working in a session
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SessionInfo {
    pub session: EntryHashB64,
    pub scribe: AgentPubKeyB64,
    pub snapshot_content: Content, // sessions start from actual content to build from
    pub snapshot_hash: EntryHashB64, // content hash at snapshot
    pub deltas: Vec<Delta>,        // deltas since snapshot
    pub content_hash: EntryHashB64, // content hash at last commit
}

fn get_sessions_path() -> Path {
    Path::from("sessions")
}

fn create_session(session: Session) -> SynResult<HeaderHash> {
    let path = get_sessions_path();
    path.ensure()?;
    let header_hash = create_entry(&session)?;
    let session_hash = hash_entry(&session)?;

    let session_anchor_hash = path.hash()?;
    create_link(session_anchor_hash, session_hash, ())?;

    Ok(header_hash)
}

/// collects the deltas from commits since given snapshot and returns:
///   - snapshot content to which they should be applied
///   - deltas in order,
///   - content hash that would result from their application
/// return error if hash not found rather than option because we
/// shouldn't be calling this function on a hash that doesn't exist
fn get_snapshot_info_for_session(
    header_hash: HeaderHashB64,
) -> SynResult<(Content, Vec<Delta>, EntryHashB64)> {
    if let Some(element) = get(HeaderHash::from(header_hash), GetOptions::content())? {
        let maybe_content: Option<Content> = element.entry().to_app_option()?;
        if let Some(content) = maybe_content {
            // get commits from this snapshot

            let (snapshot_hash, _) = element.header().entry_data().unwrap(); // should always have entry data

            let commits = get_links_and_load_type::<ContentChange>(snapshot_hash.clone(), None)?;
            debug!(
                "get_snapshot_info_for_session|commits|debug|1|{:?}",
                &commits
            );
            // build hash map from commits vec, with keys as previous_change
            let tuples = commits
                .into_iter()
                .map(|c| (c.previous_change, (c.content_hash, c.deltas)));
            let mut commits_map: HashMap<_, _> = tuples.into_iter().collect();
            // start with the content hash of the snapshot as previous_change
            let mut current_hash = EntryHashB64::from(snapshot_hash.clone());
            let mut ordered_deltas = Vec::new();
            loop {
                // look for commit with that previous_change
                if let Some((content_hash, deltas)) = commits_map.get_mut(&current_hash) {
                    // add deltas from that commit to ordered_deltas list
                    ordered_deltas.append(deltas);
                    // repeat with that commit's contentHash as next previous_change
                    current_hash = content_hash.clone();
                } else {
                    // None case (hash-map didn't find anything)
                    break;
                }
            }
            // content_hash of last Commit (current_hash) is the hash that would result from
            // the application of the deltas
            return Ok((content, ordered_deltas, current_hash));
        };
    };
    Err(SynError::HashNotFound)
}

/// builds out the session info from a given session hash.
/// return error if hash not found rather than option because we
/// shouldn't be calling this function on a hash that doesn't exist
fn build_session_info(session_hash: EntryHash) -> SynResult<SessionInfo> {
    if let Some(element) = get(session_hash, GetOptions::content())? {
        let maybe_session: Option<Session> = element.entry().to_app_option()?;
        if let Some(session) = maybe_session {
            let (snapshot_content, deltas, content_hash) =
                get_snapshot_info_for_session(session.snapshot)?;
            let (session_hash, _) = element.header().entry_data().unwrap(); // should always have entry data
            let snapshot_hash = hash_entry(&snapshot_content)?;
            return Ok(SessionInfo {
                scribe: element.header().author().clone().into(),
                session: session_hash.clone().into(),
                snapshot_content,
                snapshot_hash: snapshot_hash.into(),
                deltas,
                content_hash,
            });
        };
    };
    Err(SynError::HashNotFound)
}

#[hdk_extern]
fn get_session(session: EntryHashB64) -> ExternResult<SessionInfo> {
    Ok(build_session_info(session.into())?)
}

/// Input to the new_session call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct NewSessionInput {
    content: Content,
}

#[hdk_extern]
fn new_session(input: NewSessionInput) -> ExternResult<SessionInfo> {
    // get my pubkey
    let me = agent_info()?.agent_latest_pubkey;
    let (header_hash, content_hash) = put_content_inner(input.content.clone())?;

    let scribe = AgentPubKeyB64::from(me);
    let session = Session {
        snapshot: header_hash,
        // scribe is author
    };
    let session_hash = hash_entry(&session)?;
    let _session_header_hash = create_session(session)?;

    let snapshot_hash = hash_entry(&input.content)?;
    Ok(SessionInfo {
        scribe,
        session: session_hash.into(),
        snapshot_content: input.content,
        snapshot_hash: snapshot_hash.into(),
        content_hash,
        deltas: Vec::new(),
    })
}

#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SessionList(Vec<EntryHashB64>);
#[hdk_extern]
pub fn get_sessions(_: ()) -> ExternResult<SessionList> {
    let path = get_sessions_path();
    let links = get_links(path.hash()?, None)?.into_inner();
    let sessions = links
        .into_iter()
        .map(|l| EntryHashB64::from(l.target))
        .collect();
    debug!("get_sessions: sessions: {:?}", sessions);
    Ok(SessionList(sessions))
}
