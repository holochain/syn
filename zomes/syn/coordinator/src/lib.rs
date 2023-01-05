use hdk::prelude::*;
use messages::SynMessage;

mod commit;
mod messages;
mod root;
mod utils;
mod workspace;

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut fns = BTreeSet::new();
    fns.insert((zome_info()?.name, FunctionName("recv_remote_signal".into())));
    let cap_grant_entry: CapGrantEntry = CapGrantEntry::new(
        String::from("remote signals"), // A string by which to later query for saved grants.
        ().into(), // Unrestricted access means any external agent can call the extern
        GrantedFunctions::Listed(fns),
    );
    create_cap_grant(cap_grant_entry)?;

    Ok(InitCallbackResult::Pass)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SynSignal {
    provenance: AgentPubKey,
    message: SynMessage,
}

#[hdk_extern]
pub fn recv_remote_signal(message: SynMessage) -> ExternResult<()> {
    let info = call_info()?;

    let notice = SynSignal {
        message,
        provenance: info.provenance,
    };

    emit_signal(notice)
}
