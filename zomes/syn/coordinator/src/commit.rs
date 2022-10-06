use crate::utils::*;
use hc_zome_syn_integrity::*;
use hdk::prelude::*;

fn all_roots_path() -> Path {
    Path::from("all_roots")
}

#[hdk_extern]
pub fn create_root(commit: Commit) -> ExternResult<Record> {
    let entry_hash = hash_entry(&commit)?;
    let c = EntryTypes::Commit(commit.clone());
    let _ = create_relaxed(c, commit.clone().try_into()?);

    if !commit.previous_commit_hashes.is_empty() {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Root commit cannot contain any previous commit hashes".into()
        )));
    }

    let path = all_roots_path();

    let _ = create_link_relaxed(
        path.path_entry_hash()?,
        entry_hash.clone(),
        LinkTypes::PathToRoots,
        (),
    )?;

    let record = get(entry_hash, GetOptions::default())?;

    record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateCommitInput {
    commit: Commit,
    root_hash: EntryHash,
}
#[hdk_extern]
pub fn create_commit(input: CreateCommitInput) -> ExternResult<Record> {
    let commit = input.commit;

    let entry_hash = hash_entry(&commit)?;
    let c = EntryTypes::Commit(commit.clone());
    let _ = create_relaxed(c, commit.clone().try_into()?);

    if commit.previous_commit_hashes.is_empty() {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "The given commit doesn't have previous commits hashes, call `create_root` instead"
                .into()
        )));
    }

    let _ = create_link_relaxed(
        input.root_hash,
        entry_hash.clone(),
        LinkTypes::RootToCommits,
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
pub fn get_all_roots(_: ()) -> ExternResult<Vec<Record>> {
    let links = get_links(
        all_roots_path().path_entry_hash()?,
        LinkTypes::PathToRoots,
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

#[hdk_extern]
pub fn get_commits_for_root(root_hash: EntryHash) -> ExternResult<Vec<Record>> {
    let links = get_links(
        root_hash,
        LinkTypes::RootToCommits,
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
