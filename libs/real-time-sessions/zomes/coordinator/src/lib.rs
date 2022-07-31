extern crate hc_zome_peer_status_coordinator;

use hdk::prelude::*;

mod authority;
mod message;
mod participant;

fn all_sessions_path() -> Path {
    Path::from("all_sessions")
}
