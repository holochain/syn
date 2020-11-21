use hdk3::prelude::*;
use error::SynResult;

mod error;

#[hdk_entry(id = "node")]
#[derive(Clone)]
pub struct Node {
    content: String
}

entry_defs![
    Path::entry_def(),
    Node::entry_def()
];

/// Input to the create channel call
#[derive(Serialize, Deserialize, SerializedBytes)]
pub struct NodeInput {
    path: String,
    node: Node,
}

#[hdk_extern]
fn put(input: NodeInput) -> SynResult<HeaderHash> {
    Path::from(input.path).ensure()?;
    let hash = create_entry(&input.node)?;
    Ok(hash)
}

//#[hdk_extern]
//fn get(input: NodeInput) -> SynResult<String> {
//
//}
