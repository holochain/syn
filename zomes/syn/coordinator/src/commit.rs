use hc_zome_syn_integrity::*;
use hdk::prelude::*;

#[hdk_extern]
fn create_commit(commit: Commit) -> ExternResult<Record> {
    let entry_hash = hash_entry(&commit)?;
    let c = EntryTypes::Commit(commit.clone());
    let _ = HDK.with(|h| {
        let index = ScopedEntryDefIndex::try_from(&c)?;
        let vis = EntryVisibility::from(&c);
        let entry = commit.try_into()?;

        h.borrow().create(CreateInput::new(
            index,
            vis,
            entry,
            // This is used to test many conductors thrashing creates between
            // each other so we want to avoid retries that make the test take
            // a long time.
            ChainTopOrdering::Relaxed,
        ))
    });

    let path = all_commits_path();

    let ScopedLinkType {
        zome_id,
        zome_type: link_type,
    } = LinkTypes::PathToCommits.try_into()?;

    let _= HDK.with(|h| {
        h.borrow().create_link(CreateLinkInput::new(
            path.path_entry_hash()?.into(),
            entry_hash.clone().into(),
            zome_id,
            link_type,
            ().into(),
            ChainTopOrdering::Relaxed,
        ))
    })?;

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
