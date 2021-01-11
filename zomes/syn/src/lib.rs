use error::{SynError, SynResult};
use hdk3::prelude::*;
use link::LinkTag;
mod error;
use std::collections::HashMap;

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
    pub title: String,
    pub body: String,
}

/// Session
/// This entry holds the record of who the scribe is and a hash
/// of the content at the start of the session
/// the scribe will always be the author of the session
#[hdk_entry(id = "session")]
#[derive(Debug)]
struct Session {
    pub snapshot: HeaderHash,  // hash of the starting state for this session
    // scribe:  // scribe will always be the author of the session, look in the header
}

fn put_content_inner(content: Content) -> SynResult<(HeaderHash, EntryHash)> {
    let header_hash = create_entry(&content)?;
    let content_hash = hash_entry(&content)?;

    let path = get_snapshots_path();
    path.ensure()?;

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

/// Delta
/// change this for your app to indicate a small change in a patch-grammar
/// appropriate for your content.  Here we are just using as plain String
/// which works if you just want to convert all your Delta's to JSON.
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct Delta(String);

///  Content Change
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct ChangeMeta {
    pub contributors: Vec<AgentPubKey>,
    pub witnesses: Vec<AgentPubKey>, // maybe?
    pub app_specific: Option<SerializedBytes>,
}

/// Entry type for committing changes to the content, called by the clerk.
#[hdk_entry(id = "content_change")]
#[derive(Clone, Debug)]
pub struct ContentChange {
    pub deltas: Vec<Delta>,
    pub previous_change: EntryHash, // hash of Content on which these deltas are to be applied
    pub content_hash: EntryHash, // hash of Content with these deltas applied
    pub meta: ChangeMeta,
}

/// Input to the commit call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct CommitInput {
    pub snapshot: EntryHash,
    pub change: ContentChange,
    pub participants: Vec<AgentPubKey>, // list of participants to notify
}

#[hdk_extern]
fn commit(input: CommitInput) -> SynResult<HeaderHash> {
    let header_hash = create_entry(&input.change)?;
    let change_hash = hash_entry(&input.change)?;
    let previous_content_hash = input.change.previous_change.clone();
    let bytes: SerializedBytes = input.change.previous_change.try_into()?;
    let tag = LinkTag::from(bytes.bytes().to_vec());
    create_link(
        input.snapshot,
        change_hash.clone(),
        tag,
    )?;
    if input.participants.len() > 0 {
        let commit_info = CommitInfo {
            deltas_committed: input.change.deltas.len(),
            commit_content_hash: input.change.content_hash,
            previous_content_hash,
            commit: header_hash.clone(),
        };
        remote_signal(&SignalPayload::CommitNotice(commit_info), input.participants)?;
    }
    Ok(header_hash)
}

#[hdk_extern]
fn hash_content(content: Content) -> SynResult<EntryHash> {
    let hash = hash_entry(&content)?;
    Ok(hash)
}

///  Session Info needed to start working in a session
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SessionInfo {
    pub session: EntryHash,
    pub scribe: AgentPubKey,
    pub snapshot_content: Content, // sessions start from actual content to build from
    pub snapshot_hash: EntryHash,  // content hash at snapshot
    pub deltas: Vec<Delta>,        // deltas since snapshot
    pub content_hash: EntryHash,   // content hash at last commit
}

fn get_sessions_path() -> Path {
    Path::from("sessions")
}

fn get_snapshots_path() -> Path {
    Path::from("snapshots")
}

fn create_session(session: Session) -> SynResult<HeaderHash> {
    let path = get_sessions_path();
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

/// collects the deltas from commits since given snapshot and returns:
///   - snapshot content to which they should be applied
///   - deltas in order,
///   - content hash that would result from their application
/// return error if hash not found rather than option because we
/// shouldn't be calling this function on a hash that doesn't exist
fn get_snapshot_info_for_session(header_hash: HeaderHash) -> SynResult<(Content, Vec<Delta>, EntryHash)> {
    if let Some(element) = get(header_hash, GetOptions::content())? {
        let maybe_content: Option<Content> = element.entry().to_app_option()?;
        if let Some(content) = maybe_content {
            // get commits from this snapshot

            let (snapshot_hash, _) = element.header().entry_data().unwrap(); // should always have entry data

           let commits = get_links_and_load_type::<ContentChange>(snapshot_hash.clone(), None)?;
            // build hash map from commits vec, with keys as previous_change
            let tuples = commits.into_iter().map(|c| (c.previous_change , (c.content_hash, c.deltas)));
            let mut commits_map:HashMap<_,_> = tuples.into_iter().collect();
            // start with the content hash of the snapshot as previous_change
            let mut current_hash = snapshot_hash.clone();
            let mut ordered_deltas = Vec::new();
            loop {
                // look for commit with that previous_change
                if let Some((content_hash, deltas)) = commits_map.get_mut(&current_hash) {
                    // add deltas from that commit to ordered_deltas list
                    ordered_deltas.append(deltas);
                    // repeat with that commit's contentHash as next previous_change
                    current_hash = content_hash.clone();
                }
                else {
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
    if let Some(element) = get(session_hash,  GetOptions::content())? {
        let maybe_session: Option<Session> = element.entry().to_app_option()?;
        if let Some(session) = maybe_session {

            let (snapshot_content, deltas, content_hash) = get_snapshot_info_for_session(session.snapshot)?;
            let (session_hash, _) = element.header().entry_data().unwrap(); // should always have entry data
            let snapshot_hash = hash_entry(&snapshot_content)?;
            return Ok(SessionInfo {
                scribe: element.header().author().clone(),
                session: session_hash.clone(),
                snapshot_content,
                snapshot_hash,
                deltas,
                content_hash,
            });
        };
    };
    Err(SynError::HashNotFound)
}

#[hdk_extern]
fn get_session(session: EntryHash) -> SynResult<SessionInfo> {
    build_session_info(session)
}

/// Input to the new_session call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct NewSessionInput {
    content: Content,
}

#[hdk_extern]
fn new_session(input: NewSessionInput) -> SynResult<SessionInfo> {
    // get my pubkey
    let me = agent_info()?.agent_latest_pubkey;
    let (header_hash, content_hash) = put_content_inner(input.content.clone())?;

    let scribe = me;
    let session = Session {
        snapshot: header_hash,
        // scribe is author
    };
    let session_hash = hash_entry(&session)?;
    let _session_header_hash = create_session(session)?;

    let snapshot_hash = hash_entry(&input.content)?;
    Ok(SessionInfo{
        scribe,
        session: session_hash,
        snapshot_content: input.content,
        snapshot_hash,
        content_hash,
        deltas: Vec::new()
    })
}

#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SessionList(Vec<EntryHash>);
#[hdk_extern]
pub fn get_sessions(_: ()) -> SynResult<SessionList> {
    let path = get_sessions_path();
    let links = get_links(path.hash()?, None)?.into_inner();
    let sessions = links.into_iter().map(|l| l.target).collect();
    Ok(SessionList(sessions))
}

pub fn get_links_and_load_type<R: TryFrom<Entry>>(
    base: EntryHash,
    tag: Option<LinkTag>,
) -> SynResult<Vec<R>> {
    let links = get_links(base.into(), tag)?.into_inner();

    Ok(links
       .iter()
       .map(
           |link|  {
               if let Some(element) = get(link.target.clone(), Default::default())? {
                   let e: Entry = element.entry().clone().into_option().ok_or(SynError::HashNotFound)?;
                   let entry: R = R::try_from(e).map_err(|_e| SynError::HashNotFound)?;
                   return Ok(entry);
               };
               Err(SynError::HashNotFound)
           },
       )
       .filter_map(Result::ok)
       .collect())
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct StateForSync {
    pub snapshot: EntryHash,
    pub commit: Option<HeaderHash>,  // latest commit if there has been one since the snapshot
    pub commit_content_hash: EntryHash,
    pub deltas: Vec<Delta>, // all deltas since snapshot or that commit
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct CommitInfo {
    pub deltas_committed: usize,
    pub commit_content_hash: EntryHash,
    pub previous_content_hash: EntryHash,
    pub commit: HeaderHash,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(tag = "signal_name", content = "signal_payload")]
enum SignalPayload {
    SyncReq(AgentPubKey), // content is who the request is from
    SyncResp(StateForSync),
    ChangeReq(Change),
    Change(Change),
    Heartbeat(String),   // signal to scribe for maintaining participant info
    FolkLore(String),     // signal to participants to update other participants info
    CommitNotice(CommitInfo) // signal for sennding commit and content hash after commit
}

#[hdk_extern]
fn recv_remote_signal(signal: SerializedBytes) -> SynResult<()> {
    let sig: SignalPayload = SignalPayload::try_from(signal.clone())?;
    debug!(format!("Received remote signal {:?}", sig));
    emit_signal(&signal)?;
    Ok(())
}

#[hdk_extern] fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut functions: GrantedFunctions = HashSet::new();
    functions.insert((zome_info()?.zome_name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(), functions,
    })?;
    Ok(InitCallbackResult::Pass)
}

/// Input to the send sync response call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendSyncResponseInput {
    pub participant: AgentPubKey,
    pub state: StateForSync,
}

#[hdk_extern]
fn send_sync_response(input:SendSyncResponseInput) -> SynResult<()> {
    // send response signal to the participant
    remote_signal(&SignalPayload::SyncResp(input.state), vec![input.participant])?;
    Ok(())
}

/// Input to the send sync req call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendSyncRequestInput {
    pub scribe: AgentPubKey,
}

#[hdk_extern]
fn send_sync_request(input:SendSyncRequestInput) -> SynResult<()> {
    let me = agent_info()?.agent_latest_pubkey;
    remote_signal(&SignalPayload::SyncReq(me), vec![input.scribe])?;
    Ok(())
}

/// Change struct that is sent by the scribe to participants
/// consists of a set of deltas, an and indicator of the index
/// into the list of uncommited deltas this change starts at.
/// UI's are expected to be able to receive and handle changes
/// out of order by looking at the index, and can use sync requests
/// to catch up if necessary.
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct Change((u32, Vec<Delta>));

/// Input to the send change call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendChangeRequestInput {
    pub scribe: AgentPubKey,
    pub change: Change,
}

#[hdk_extern]
fn send_change_request(input:SendChangeRequestInput) -> SynResult<()> {
    // send response signal to the participant
    remote_signal(&SignalPayload::ChangeReq(input.change), vec![input.scribe])?;
    Ok(())
}

/// Input to the send change response call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendChangeInput {
    pub participants: Vec<AgentPubKey>,
    pub change: Change,
}

#[hdk_extern]
fn send_change(input:SendChangeInput) -> SynResult<()> {
    // send response signal to the participant
    remote_signal(&SignalPayload::Change(input.change), input.participants)?;
    Ok(())
}

/// Input to the send heartbeat call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendHeartbeatInput {
    pub scribe: AgentPubKey,
    pub data: String,
}

#[hdk_extern]
fn send_heartbeat(input:SendHeartbeatInput) -> SynResult<()> {
    remote_signal(&SignalPayload::Heartbeat(input.data), vec![input.scribe])?;
    Ok(())
}


/// Input to the send folklore call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct SendFolkLoreInput {
    pub participants: Vec<AgentPubKey>,
    pub data: String,
}

#[hdk_extern]
fn send_folk_lore(input:SendFolkLoreInput) -> SynResult<()> {
    remote_signal(&SignalPayload::FolkLore(input.data), input.participants)?;
    Ok(())
}
