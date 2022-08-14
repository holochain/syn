use hc_zome_syn_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
fn create_commit(commit: Commit) -> ExternResult<Record> {
    let entry_hash = hash_entry(&commit)?;

    create_entry(EntryTypes::Commit(commit))?;

    let path = all_commits_path();

    create_link(
        path.path_entry_hash()?,
        entry_hash.clone(),
        LinkTypes::PathToCommits,
        (),
    )?;

    let record = get(entry_hash, GetOptions::default())?;

    record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))
}

#[hdk_extern]
pub fn get_commit(commit_hash: EntryHash) -> ExternResult<Option<Record>> {
    get(commit_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_all_commits(_: ()) -> ExternResult<Vec<Record>> {
    let links = get_links(
        all_commits_path().path_entry_hash()?,
        LinkTypes::PathToCommits,
        None,
    )?;

    let get_inputs = links
        .into_iter()
        .map(|link| {
            GetInput::new(
                AnyDhtHash::from(EntryHash::from(link.target)),
                GetOptions::default(),
            )
        })
        .collect();

    let maybe_records = HDK.with(|hdk| hdk.borrow().get(get_inputs))?;

    let records: Vec<Record> = maybe_records.into_iter().filter_map(|e| e).collect();

    Ok(records)
}

fn all_commits_path() -> Path {
    Path::from("all_commits")
}
