use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct SessionMessage {
    pub session_hash: ActionHash,
    pub message: SerializedBytes,
}
