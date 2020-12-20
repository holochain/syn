# syn

Real-time shared state on Holochain

## Context

Small collaborative teams want to work real-time on documents, kan-ban boards, drawings, etc.  Tools like Google Docs, Miro, etc provide the state-of-the-art in user experience in this realm.  All of them rely on central servers to manage shared state.  Syn is an experimental zome and UI library to provide similar level of experience in the fully distributed Holochain context.
**Intentional Limmitations:** Syn is designed for, and takes advantage of, the assumption of small numbers of non-malicious users.

## Design Overview

### Ontology

**Content State**: we assume that each DHT is used to evolve the state of a single "Work", i.e. a document, or diagram, or what ever is collaboratively being built by the App.

**Delta**: the state is evolved by individual agent's creating a Content Delta using an application specific "patch" grammar, that can be applied to a content state.  Deltas are small scale changes that are intended to be sent to participating nodes in real-time (like adding a character or word to a document) and contain both content delta, and "meta" deltas which can be used to update non-"work" data in UI's for example other participants viewing location, etc.

**Content Commit**: a set of Content Deltas along with the hash of previous state, comprises a Commit.  When commits happen varies across use-cases, but is usually a funciton of crossing thresholds of time and/or quantity of Deltas.

**Snap-Shot**: a periodic commit of the Content State itself, used for initializing UI state as nodes come on-line.

**Session**: in a server-less world, Syn uses the notion of sessions in which a scribe (or leader in usual consensus talk) is chosen to ensure consitent shared state.  Various possibilities exist for the selection but probably the best choice is by lowest-latency (determined by the heartbeat health-check) and/or by most active participant so that they get the best user experience.

**Heartbeat:** Session participants conect with eachother on a regular heartbeat to assemble latency information, and to maintain awarenes of session status.


### Intitialization
All nodes add a link to a "Users" anchor pointing to their agent pub key so that participating agents can be bootstrapped.

### Entries
#### Content Change
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
- when a ContentChange is committed, we add a link from the previous Content snap-shot to the ContentChange using the `previous_change` hash as the tag.  This allows recreation of the exact state as a node joins the network.
#### Content Snap-shot
```rust
struct Content {
    /// ADD YOUR CONTENT STRUCTURE HERE!
}
```
**Notes**: Add link from "Snapshots" anchor to Content when added.  This is needed for creating a new session.  See below.

### Real-time Signals
All signals are implemented using fire-and-forget remote_call which will be called remote_sginal
- `ChangeReq(Delta)`: Participant -> Scribe. Nodes that have joined a session, send the session scribe Deltas
- `Change(Vec<Delta>)`: Scribe -> Prticipant. The scribe sends an ordered list of Deltas to apply to the state.
- `CommitNotice(EntryHash)`: Scribe -> Participants.  When making a commit scribe sends a commit notice with the hash.  This can be used by participants to resync if they missed any deltas.
- `SycnReq()` Participant -> Scribe: request latest Snapshot and Commit.
- `SyncResp(SnapshotHash, CommitHash, Deltas)`: Scribe -> Participant.  Respond with the data needed for a joining/syncing participant to build the current session full state.


### Sessions
A "session" is simply the designation of a scribe.  Joining a session is finding out who is currently the scribe/ or self-declaring as if you can't find anybody. To work well this really requires the ephemeral store, but in the mean time we simply commit Session entries which are linked off a anchor, and use the following algorithm:
1. Get recent Sessions (get-links)
2. Send recent scribe SyncReq() in order until you get a response fall back to other nodes from the "Users" list, or
3. Look up latest snapshot from Snapshots anchor and choose one to start from.  This is probably different in an app specific way, it could be latest, or require analysis of session, or User intervention.  Create a new session with yourself as scribe (note the human may request skipping to this right away if they know they are off-line)
```rust
struct Session {
    scribe: AgentPubKey, // agent responsible for making commits during the session
    snapshot: EntryHash,  // hash of the starting state for this content
}
```

#### Session Broadcast/Refresh
Scribe should broadcast session refresh on a periodic basis for the sessions ephemeral stores.

#### Session Merging
If a node is editing off-line it has basically chosen itself as the scribe.  When it comes on-line it will likely need to merge into an existing session.  Additionally nodes may partition and then multi-node sessions may need to merge.

1. **1 Joining Many**: When the single node detects this case, it takes on the responsibility of sending a change-set that can merge from what ever state it gets from the scribe.  This may be simple or impossible, in which case you might just throw away your changes, and may depend on user decision.
2. **Many joining Many**: This requires an app-specific way to choose a scribe from the set, and then delegate the merge choice to that scribe.




























.
