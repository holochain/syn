use commit::CommitInfo;
use delta::Change;
use folks::register_as_folk;
use hdk::prelude::holo_hash::AgentPubKeyB64;
use hdk::prelude::*;

mod commit;
mod content;
mod delta;
mod error;
mod folks;
mod session;
mod sync;
mod utils;

use session::Session;

use content::Content;
use sync::StateForSync;

use crate::commit::ContentChange;

entry_defs![
    Path::entry_def(),
    Content::entry_def(),
    ContentChange::entry_def(),
    Session::entry_def()
];

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(tag = "signal_name", content = "signal_payload")]
enum SignalPayload {
    SyncReq(AgentPubKeyB64), // content is who the request is from
    SyncResp(StateForSync),
    ChangeReq(Change),
    Change(Change),
    Heartbeat((AgentPubKeyB64, String)), // signal to scribe for maintaining participant info
    FolkLore(String),                    // signal to participants to update other participants info
    CommitNotice(CommitInfo),            // signal for sennding commit and content hash after commit
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
    functions.insert((zome_info()?.zome_name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;

    register_as_folk()?;

    Ok(InitCallbackResult::Pass)
}
