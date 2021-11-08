use commit::CommitNotice;
use change::{ChangeNotice, ChangeRequest};
use folks::{register_as_folk, FolkLore, Heartbeat};
use hdk::prelude::*;
use holo_hash::EntryHashB64;

mod commit;
mod change;
mod error;
mod folks;
mod session;
mod snapshot;
mod sync;
mod utils;

use session::Session;

use snapshot::Snapshot;
use sync::{RequestSyncInput, StateForSync};

use crate::commit::Commit;

entry_defs![
    Path::entry_def(),
    Snapshot::entry_def(),
    Commit::entry_def(),
    Session::entry_def()
];

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SignalPayload {
    session_hash: EntryHashB64,
    message: SynMessage,
}

impl SignalPayload {
    fn new(session_hash: EntryHashB64, message: SynMessage) -> Self {
        SignalPayload {
            session_hash,
            message,
        }
    }
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(tag = "type", content = "payload")]
enum SynMessage {
    SyncReq(RequestSyncInput), // content is who the request is from
    SyncResp(StateForSync),
    ChangeReq(ChangeRequest),
    ChangeNotice(ChangeNotice),
    Heartbeat(Heartbeat), // signal to scribe for maintaining participant info
    FolkLore(FolkLore),   // signal to participants to update other participants info
    CommitNotice(CommitNotice), // signal for sennding commit and content hash after commit
}

#[hdk_extern]
fn recv_remote_signal(signal: ExternIO) -> ExternResult<()> {
    let sig: SignalPayload = signal.decode()?;
    debug!("Received remote signal {:?}", sig);
    Ok(emit_signal(&sig)?)
}

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut functions: GrantedFunctions = BTreeSet::new();
    functions.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;

    register_as_folk()?;

    Ok(InitCallbackResult::Pass)
}
