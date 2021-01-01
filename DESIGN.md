# syn

Real-time shared state on Holochain

## Context

Small collaborative teams want to work real-time on text documents, Kanban boards, drawings, etc.  Tools like Google Docs, [HackMD](hackmd.io), and [Miro](https://miro.com/) provide the state-of-the-art in user experience in this realm.  All of them rely on central servers to manage shared state.  Syn is an experimental zome and UI library to provide similar level of experience in the fully distributed Holochain context.
**Intentional Limitations:** Syn is designed for, and takes advantage of, the assumption of small numbers of non-malicious users.

## Design Overview

### Ontology

**Content State**: we assume that each DHT is used to evolve the state of a single "Work", i.e. a document, or diagram, or what ever is collaboratively being built by the App.

**Delta**: the state is evolved by individual agents creating a "Content Delta" using an application-specific "Patch Grammar", that can be applied to a Content State.  Deltas are small scale changes that are intended to be sent to participating nodes in real-time (like adding a character or word to a document). Sent along with Content deltas are "Meta Deltas" which can be used to update non-Work data in UIs for example other participants' viewing locations.

**Content Commit**: a set of Content Deltas, along with the hash of the previous state, comprises a "Commit".  You can think of a commit as a recording of a set of changes to the content.  Commits happen at different frequencies depending on the use-case.  Commits are usually triggered by crossing thresholds of time and/or quantity of Deltas.

**Snapshot**: a periodic commit of the Content State itself, used for initializing UI state as nodes come online.

**Session**: Syn uses the notion of "Sessions" which consist of choosing a Scribe and then continuing on to edit the Work.

**Scribe**: a "Scribe" (or leader in usual consensus talk) is one chosen participant who takes on the role of collecting Deltas and making Commits. Various possibilities exist for how to select a Scribe. Probably best is choosing the lowest network latency participant (determined by the Heartbeat health-check) or choosing the most active participant so that they get the best user experience.

**Heartbeat:** Session participants connect with each other through a regular "Heartbeat" to assemble latency information, and to maintain awareness of Session status.


### Initialization
All nodes add a link to a "Users" anchor pointing to their agent pub key so that participating agents can be bootstrapped.

### Entries
#### Content Change (aka Commit)
```rust
struct ChangeMeta {
    contributors: Vec<AgentPubKey>,
    witnesses: Vec<AgentPubKey>, // maybe?
    app_specific: SerializedBytes,
}
struct ContentChange {
    deltas: Vec<SerializedBytes>,
    previous_change: EntryHash, // hash of Content on which these deltas are to be applied
    meta: ChangeMeta
}
```
Notes:
- when a `ContentChange` is committed, we add a link from the previous Content Snapshot to the `ContentChange` using the `previous_change` hash as the tag.  This allows recreation of the exact state as a node joins the network.
#### Content Snapshot
```rust
struct Content {
    /// ADD YOUR CONTENT STRUCTURE HERE!
}
```
Notes:
- when a Content Snapshot is created, we add a link from the "Snapshots" anchor to the new Snapshot.  This is needed for creating a new session.  See below.

### Real-time Signals
All signals are implemented using fire-and-forget remote_signal
- `ChangeReq((Index, Vec<Delta>))`: Participant -> Scribe. A node that has joined a Session sends the Session's Scribe some Deltas (in the Work's Patch Grammar) representing a change to the Work from the given index of previous deltas.  The `Index` indicates after which deltas since the last commit as recorded by the scribe the given delta applies, so that the scribe can appropriately apply the patch given other deltas that may have arrived from other participants.
- `Change((Index, Vec<Delta>))`: Scribe -> Participants. The Scribe sends all participants ordered Deltas to apply to their local states.  The UI's are responsible to make sure the deltas are applied correctly on top of the given index.
- `CommitNotice(EntryHash)`: Scribe -> Participants.  When making a Commit, Scribe sends a Commit Notice with the hash.  This can be used by participants to resync if they missed any Deltas.
- `SycnReq()` Participant -> Scribe: request latest state for joining/syncing.
- `SyncResp(SnapshotHash, CommitHash, Vec<Delta>)`: Scribe -> Participant.  Respond with the data needed for a joining/syncing participant to build the current Session's full state.


### Sessions
Making a Session is as simple as designating a Scribe.  Joining a Session is finding out who the Scribe is, or self-declaring as such if you can't find anybody.  To work well this really requires Holochain's upcoming ephemeral store feature, but in the mean time we simply commit Session entries which are linked off an anchor, and use the following algorithm:
1. Get recent Sessions (`get-links`)
2. Send the Scribes of these sessions `SyncReq()`s, in order, until you get a response, which will allow you to build the Session state and start sending Deltas to the Scribe who responded.
3. If this doesn't work, fall back to requesting from other nodes on the "Users" list.
4. If still nobody replies with a `SyncResp`, assume you are offline or an active Session can't be found.  Look up Snapshots from the "Snapshots" anchor and choose one to start from. (This is probably different in an app-specific way; it could be the latest Snapshot, or require analysis of the Session, or User intervention.)
5. Create a new Session with yourself as Scribe (note that the human may request skipping to this right away if they know they are offline)
```rust
struct Session {
    scribe: AgentPubKey, // agent responsible for making Commits during the session
    snapshot: EntryHash,  // hash of the starting Content State for this Session
}
```

#### Session Broadcast/Refresh
Scribe should broadcast session refresh on a periodic basis for the Session's ephemeral stores.

#### Session Merging
If a node is editing offline it has basically chosen itself as the Scribe.  When it comes online it will likely need to merge into an existing session.  Additionally nodes may partition and then multi-node sessions may need to merge.

1. **One Joining Many**: When the single node detects this case, it takes on the responsibility of sending a change-set that can merge from what ever state it gets from the scribe.  This may be simple or impossible, in which case you might just throw away your changes, and may depend on user decision.
2. **Many joining Many**: This requires an app-specific way to choose a Scribe from the set, and then delegate the merge choice to that Scribe.
