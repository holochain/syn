use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

use crate::SignalPayload;
use crate::delta::Delta;

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct CommitInfo {
    pub deltas_committed: usize,
    pub commit_content_hash: EntryHashB64,
    pub previous_content_hash: EntryHashB64,
    pub commit: HeaderHashB64,
}

///  Content Change
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct ChangeMeta {
    pub contributors: Vec<AgentPubKeyB64>,
    pub witnesses: Vec<AgentPubKeyB64>, // maybe?
    pub app_specific: Option<SerializedBytes>,
}

/// Entry type for committing changes to the content, called by the clerk.
#[hdk_entry(id = "content_change")]
pub struct ContentChange {
    pub deltas: Vec<Delta>,
    pub previous_change: EntryHashB64, // hash of Content on which these deltas are to be applied
    pub content_hash: EntryHashB64,    // hash of Content with these deltas applied
    pub meta: ChangeMeta,
}

/// Input to the commit call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct CommitInput {
    pub snapshot: EntryHashB64,
    pub change: ContentChange,
    pub participants: Vec<AgentPubKeyB64>, // list of participants to notify
}

#[hdk_extern]
fn commit(input: CommitInput) -> ExternResult<HeaderHashB64> {
    let header_hash = create_entry(&input.change)?;
    let change_hash = hash_entry(&input.change)?;
    let previous_content_hash = input.change.previous_change.clone();
    let bytes: SerializedBytes = EntryHash::from(input.change.previous_change).try_into()?;
    let tag = LinkTag::from(bytes.bytes().to_vec());
    create_link(EntryHash::from(input.snapshot), change_hash.clone(), tag)?;

    let header_hash_b64 = HeaderHashB64::from(header_hash);

    if input.participants.len() > 0 {
        let commit_info = CommitInfo {
            deltas_committed: input.change.deltas.len(),
            commit_content_hash: input.change.content_hash,
            previous_content_hash,
            commit: header_hash_b64.clone(),
        };
        let payload = ExternIO::encode(SignalPayload::CommitNotice(commit_info))?;

        let participants = input
            .participants
            .into_iter()
            .map(|a| AgentPubKey::from(a))
            .collect();
        remote_signal(payload, participants)?;
    }
    Ok(header_hash_b64)
}
