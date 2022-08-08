use hdk::prelude::*;
use workspace::WorkspaceMessage;

mod commit;
mod workspace;

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut functions = BTreeSet::new();
    functions.insert((zome_info()?.name, FunctionName("recv_remote_signal".into())));
    let cap_grant_entry: CapGrantEntry = CapGrantEntry::new(
        String::from("remote signals"), // A string by which to later query for saved grants.
        ().into(), // Unrestricted access means any external agent can call the extern
        functions,
    );
    create_cap_grant(cap_grant_entry)?;

    Ok(InitCallbackResult::Pass)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SynSignal {
  provenance: AgentPubKey,
  message: WorkspaceMessage
}

#[hdk_extern]
pub fn recv_remote_signal(signal: ExternIO) -> ExternResult<()> {
    let message: WorkspaceMessage = signal
        .decode()
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.into())))?;

    let info = call_info()?;

    let notice = SynSignal {
        message,
        provenance: info.provenance,
    };

    emit_signal(notice)
}
