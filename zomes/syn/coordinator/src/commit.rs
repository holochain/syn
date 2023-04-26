use crate::utils::*;
use hc_zome_syn_integrity::*;
use hdk::prelude::*;

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
pub fn get_commits_for_root(root_hash: EntryHash) -> ExternResult<Vec<Record>> {
    let links = get_links(root_hash.clone(), LinkTypes::RootToCommits, None)?;

    let mut get_inputs: Vec<GetInput> = links
        .into_iter()
        .filter_map(|link| {
            Some(GetInput::new(
                AnyDhtHash::try_from(link.target).ok()?,
                GetOptions::default(),
            ))
        })
        .collect();

    get_inputs.push(GetInput::new(
        AnyDhtHash::from(root_hash),
        GetOptions::default(),
    ));

    let maybe_records = HDK.with(|hdk| hdk.borrow().get(get_inputs))?;

    let records: Vec<Record> = maybe_records.into_iter().filter_map(|e| e).collect();

    Ok(records)
}
