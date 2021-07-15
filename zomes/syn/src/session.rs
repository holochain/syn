use std::collections::HashMap;

use chrono::{serde::ts_milliseconds, DateTime, NaiveDateTime, Utc};
use hdk::prelude::holo_hash::*;
use hdk::prelude::*;

use crate::commit::Commit;
use crate::content::{get_snapshot, Content};
use crate::error::{SynError, SynResult};
use crate::utils::get_links_and_load_type;

/// Session
/// This entry holds the record of who the scribe is and a hash
/// of the content at the start of the session
/// the scribe will always be the author of the session
#[hdk_entry(id = "session")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub snapshot_hash: EntryHashB64, // hash of the starting state for this session
    pub scribe: AgentPubKeyB64,      // scribe
    #[serde(with = "ts_milliseconds")]
    pub created_at: DateTime<Utc>,
}

/// Session Info needed to start working in a session
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub session_hash: EntryHashB64,
    pub session: Session,
    // All content changes that have been made in this session
    pub commits: HashMap<HeaderHashB64, Commit>,
    // sessions start from actual content to build from
    pub snapshot: Content,
}

#[hdk_extern]
fn get_session(session: EntryHashB64) -> ExternResult<SessionInfo> {
    Ok(build_session_info(session.into())?)
}

/// Input to the new_session call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewSessionInput {
    pub snapshot_hash: EntryHashB64,
}

#[hdk_extern]
fn new_session(input: NewSessionInput) -> ExternResult<SessionInfo> {
    let content = get_snapshot(input.snapshot_hash.clone())?.ok_or(SynError::HashNotFound)?;

    // get my pubkey
    let me = agent_info()?.agent_latest_pubkey;

    let now = sys_time()?;
    let created_at = DateTime::from_utc(
        NaiveDateTime::from_timestamp(now.as_secs() as i64, now.subsec_nanos()),
        Utc,
    );

    let session = Session {
        snapshot_hash: input.snapshot_hash.clone(),
        // scribe is author
        scribe: me.into(),
        created_at,
    };
    let session_hash = hash_entry(&session)?;
    create_session(session.clone())?;

    Ok(SessionInfo {
        session_hash: session_hash.into(),
        session,
        commits: HashMap::new(), // no commits yet
        snapshot: content,
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

/** Helpers */

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

/// builds out the session info from a given session hash.
/// return error if hash not found rather than option because we
/// shouldn't be calling this function on a hash that doesn't exist
fn build_session_info(session_hash: EntryHash) -> SynResult<SessionInfo> {
    let element =
        get(session_hash.clone(), GetOptions::content())?.ok_or(SynError::HashNotFound)?;
    let session: Session = element
        .entry()
        .to_app_option()?
        .ok_or(SynError::HashNotFound)?;

    let snapshot_hash = session.snapshot_hash.clone();

    let snapshot_element = get(
        EntryHash::from(snapshot_hash.clone()),
        GetOptions::content(),
    )?
    .ok_or(SynError::HashNotFound)?;
    let snapshot: Content = snapshot_element
        .entry()
        .to_app_option()?
        .ok_or(SynError::HashNotFound)?;

    let commits = get_links_and_load_type::<Commit>(snapshot_hash.clone().into(), None)?;

    return Ok(SessionInfo {
        session_hash: session_hash.clone().into(),
        session,
        commits: index_by_header_hash(commits),
        snapshot,
    });
}

fn index_by_header_hash(
    commits: Vec<(HeaderHash, EntryHash, Commit)>,
) -> HashMap<HeaderHashB64, Commit> {
    let mut indexed: HashMap<HeaderHashB64, Commit> = HashMap::new();
    for commit in commits {
        indexed.insert(commit.0.into(), commit.2);
    }

    indexed
}
