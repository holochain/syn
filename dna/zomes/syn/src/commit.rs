use std::usize;

use chrono::{serde::ts_milliseconds, DateTime, Utc};
use hdk::prelude::*;
use holo_hash::*;

use crate::change::ChangeBundle;
use crate::error::SynError;
use crate::utils::element_to_entry;
use crate::{SignalPayload, SynMessage};

#[derive(Serialize, Deserialize, Debug)]
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
            EntryHash::from(previous_commit_hash),
            commit_hash.clone(),
            tag.clone(),
        )?;
    }

    let commit_hash_b64 = EntryHashB64::from(commit_hash);

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
