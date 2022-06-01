use std::collections::BTreeMap;
use std::usize;

use chrono::{serde::ts_milliseconds, DateTime, Utc};
use hdk::prelude::*;
use holo_hash::*;

use crate::change::ChangeBundle;
use crate::error::{SynError, SynResult};
use crate::utils::element_to_entry;
use crate::{SignalPayload, SynLinkType, SynMessage};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CommitNotice {
    pub commit_hash: EntryHashB64,
    pub committed_deltas_count: usize,

    pub previous_content_hash: EntryHashB64,
    pub new_content_hash: EntryHashB64,

    pub meta: ChangeMeta,
}

///  Content Change
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangeMeta {
    pub witnesses: Vec<AgentPubKeyB64>, // maybe?
    pub app_specific: Option<SerializedBytes>,
}

/// Entry type for committing changes to the content, called by the clerk.
#[hdk_entry(id = "content_change")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Commit {
    pub changes: ChangeBundle,

    pub previous_commit_hashes: Vec<EntryHashB64>,
    #[serde(with = "ts_milliseconds")]
    pub created_at: DateTime<Utc>,

    // hash of Content on which these deltas are to be applied
    pub previous_content_hash: EntryHashB64,
    // hash of Content with these deltas applied
    pub new_content_hash: EntryHashB64,

    pub meta: ChangeMeta,
}

/// Input to the commit call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitInput {
    pub session_hash: EntryHashB64,

    pub commit: Commit,

    pub participants: Vec<AgentPubKeyB64>, // list of participants to notify
}

#[hdk_extern]
fn commit_changes(input: CommitInput) -> ExternResult<EntryHashB64> {
    let commit = input.commit.clone();
    let delta_count = commit.changes.deltas.len();

    create_entry(&commit)?;
    let commit_hash = hash_entry(&commit)?;

    let bytes: SerializedBytes = EntryHash::from(input.session_hash.clone()).try_into()?;
    let tag = LinkTag::from(bytes.bytes().to_vec());

    for previous_commit_hash in input.commit.previous_commit_hashes {
        create_link(
            EntryHash::from(previous_commit_hash).into(),
            commit_hash.clone().into(),
            SynLinkType::PreviousCommit,
            tag.clone(),
        )?;
    }

    let commit_hash_b64 = EntryHashB64::from(commit_hash);

    add_commit(commit_hash_b64.clone())?;

    if input.participants.len() > 0 {
        let commit_info = CommitNotice {
            committed_deltas_count: delta_count,
            new_content_hash: commit.new_content_hash,
            previous_content_hash: commit.previous_content_hash,
            commit_hash: commit_hash_b64.clone(),
            meta: commit.meta,
        };
        let payload = ExternIO::encode(SignalPayload::new(
            input.session_hash,
            SynMessage::CommitNotice(commit_info),
        ))?;

        let participants = input
            .participants
            .into_iter()
            .map(|a| AgentPubKey::from(a))
            .collect();
        remote_signal(payload, participants)?;
    }
    Ok(commit_hash_b64)
}

#[hdk_extern]
pub fn get_commit(commit_hash: EntryHashB64) -> ExternResult<Commit> {
    let element =
        get(EntryHash::from(commit_hash), GetOptions::default())?.ok_or(SynError::HashNotFound)?;

    let (_, commit) = element_to_entry::<Commit>(element)?;

    Ok(commit)
}

fn add_commit(commit_hash: EntryHashB64) -> ExternResult<()> {
    let path = all_commits_path();
    path.ensure()?;

    create_link(
        path.path_entry_hash()?.into(),
        EntryHash::from(commit_hash).into(),
        SynLinkType::PathToCommit,
        (),
    )?;
    Ok(())
}

#[hdk_extern]
pub fn get_all_commits(_: ()) -> ExternResult<BTreeMap<EntryHashB64, Commit>> {
    let links = get_links(all_commits_path().path_entry_hash()?.into(), None)?;

    let get_inputs = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let elements = HDK.with(|hdk| hdk.borrow().get(get_inputs))?;

    let commits: BTreeMap<EntryHashB64, Commit> = elements
        .into_iter()
        .filter_map(|e| e)
        .map(|e| element_to_entry::<Commit>(e))
        .collect::<SynResult<Vec<(EntryHashB64, Commit)>>>()?
        .into_iter()
        .collect();

    Ok(commits)
}

fn all_commits_path() -> Path {
    Path::from("all_commits")
}
