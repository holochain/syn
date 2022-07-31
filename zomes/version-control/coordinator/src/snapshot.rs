use hdk::prelude::*;
use hc_zome_version_control_integrity::*;

#[hdk_extern]
pub fn put_snapshot(snapshot: Snapshot) -> ExternResult<EntryHash> {
    let snapshot_hash = hash_entry(&snapshot)?;

    let maybe_snapshot = get(snapshot_hash.clone(), GetOptions::default())?;
    if maybe_snapshot.is_none() {
        create_entry(EntryTypes::Snapshot(snapshot))?;
    }

    Ok(snapshot_hash)
}

#[hdk_extern]
pub fn get_snapshot(input: EntryHash) -> ExternResult<Option<Snapshot>> {
    if let Some(record) = get(input, GetOptions::content())? {
        record.into_inner().1.to_app_option().map_err(|err| wasm_error!(err.into()))
    } else {
        Ok(None)
    }
}

#[hdk_extern]
fn hash_snapshot(snapshot: Snapshot) -> ExternResult<EntryHash> {
    hash_entry(&snapshot)
}
