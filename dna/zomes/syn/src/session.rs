use std::collections::HashMap;

use chrono::{serde::ts_milliseconds, DateTime, Utc};
use hdk::prelude::*;
use holo_hash::*;

use crate::error::{SynError, SynResult};
use crate::utils::element_to_entry;
use crate::{SignalPayload, SynMessage};

/// Session
/// This entry holds the record of who the scribe is and a hash
/// of the content at the start of the session
/// the scribe will always be the author of the session
#[hdk_entry(id = "session")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub initial_commit_hash: Option<EntryHashB64>, // hash of the starting state for this session
    pub scribe: AgentPubKeyB64,                    // scribe
    #[serde(with = "ts_milliseconds")]
    pub created_at: DateTime<Utc>,
}

/// Session Info needed to start working in a session
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub session_hash: EntryHashB64,
    pub session: Session,
}

#[hdk_extern]
fn get_session(session: EntryHashB64) -> ExternResult<Session> {
    let element =
        get(EntryHash::from(session), GetOptions::default())?.ok_or(SynError::HashNotFound)?;

    let (_, session) = element_to_entry::<Session>(element)?;

    Ok(session)
}

/// Input to the new_session call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewSessionInput {
    pub initial_commit_hash: Option<EntryHashB64>,
}

#[hdk_extern]
fn new_session(input: NewSessionInput) -> ExternResult<SessionInfo> {
    // get my pubkey
    let me = agent_info()?.agent_latest_pubkey;

    let now = sys_time()?;
    let created_at =
        DateTime::try_from(now).or(Err(WasmError::Guest("Could not get timestamp".into())))?;

    let session = Session {
        initial_commit_hash: input.initial_commit_hash,
        // scribe is author
        scribe: me.into(),
        created_at,
    };
    let session_hash = hash_entry(&session)?;
    create_session(session.clone())?;

    Ok(SessionInfo {
        session_hash: session_hash.into(),
        session,
    })
}

#[hdk_extern]
pub fn get_sessions(_: ()) -> ExternResult<HashMap<EntryHashB64, Session>> {
    let path = get_sessions_path();
    let links = get_links(path.path_entry_hash()?, None)?;

    let sessions_get_inputs = links
        .into_iter()
        .map(|l| GetInput::new(AnyDhtHash::from(l.target), GetOptions::default()))
        .collect();

    let sessions_vec = HDK.with(|h| h.borrow().get(sessions_get_inputs))?;
    let mut sessions = HashMap::new();

    for session in sessions_vec {
        if let Some(element) = session {
            let (session_hash, session) = element_to_entry::<Session>(element)?;
            sessions.insert(session_hash, session);
        }
    }

    debug!("get_sessions: sessions: {:?}", sessions);
    Ok(sessions)
}

/// Input to the new_session call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CloseSessionInput {
    pub session_hash: EntryHashB64,
    pub participants: Vec<AgentPubKeyB64>,
}

#[hdk_extern]
pub fn close_session(input: CloseSessionInput) -> ExternResult<()> {
    // TODO: add validation so that only the scribe can delete it
    let path = get_sessions_path();
    let links = get_links(path.path_entry_hash()?, None)?;

    let session_hash = EntryHash::from(input.session_hash.clone());

    let maybe_link = links.into_iter().find(|link| session_hash.eq(&link.target));

    match maybe_link {
        Some(link) => {
            delete_link(link.create_link_hash)?;
        }
        None => Err(SynError::HashNotFound)?,
    }

    let participants: Vec<AgentPubKey> = input.participants.into_iter().map(|a| a.into()).collect();

    // send response signal to the participant
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::SessionClosed,
        ))?,
        participants,
    )?;

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NotifyLeaveSessionInput {
    pub session_hash: EntryHashB64,
    pub scribe: AgentPubKeyB64,
}

#[hdk_extern]
pub fn notify_leave_session(input: NotifyLeaveSessionInput) -> ExternResult<()> {
    remote_signal(
        ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::LeaveSessionNotice(agent_info()?.agent_latest_pubkey.into()),
        ))?,
        vec![input.scribe.into()],
    )?;

    Ok(())
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

    let session_anchor_hash = path.path_entry_hash()?;
    create_link(session_anchor_hash, session_hash, ())?;

    Ok(header_hash)
}
