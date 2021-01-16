import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import { HoloHash } from '@holochain/conductor-api'
import * as _ from 'lodash'
import path from 'path'

const delay = ms => new Promise(r => setTimeout(r, ms));

const config = Config.gen();

const dna = path.join(__dirname, '../../syn.dna.gz')

console.log(dna)

const installation: InstallAgentsHapps = [
    // one agents
    [[dna]], // contains 1 dna
]

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});


type Add = [number, string]
type Delete = [number, number]
type Title = string

// Signal type definitions
type Delta = {
  type: string,
  value: Add | Delete | Title,
}

type StateForSync = {
  snapshot: HoloHash,
  commit: HoloHash,
  deltas: Delta[],
}

type Signal = {
  signal_name: string,
  signal_payload?
}

module.exports = (orchestrator) => {
    orchestrator.registerScenario('syn basic zome calls', async (s, t) => {

        // Delta representation could be JSON or not, for now we are using
        // json so setting this variable to true
        const jsonDeltas = true;

        const [me_player, alice_player, bob_player] = await s.players([config, config, config])
        const [[me_happ]] = await me_player.installAgentsHapps(installation)
        const [[alice_happ]] = await alice_player.installAgentsHapps(installation)
        const [[bob_happ]] = await bob_player.installAgentsHapps(installation)

        await s.shareAllNodes([me_player, alice_player, bob_player]);

        const me = me_happ.cells[0]
        const alice = alice_happ.cells[0]
        const bob = bob_happ.cells[0]

        const me_pubkey = me.cellId[1]
        const alice_pubkey = alice.cellId[1]
        const bob_pubkey = bob.cellId[1]

        let sessions = await me.call('syn', 'get_sessions')
        t.equal(sessions.length, 0)

        // create initial session
        let sessionInfo = await me.call('syn', 'new_session', {content: {title:"", body:""}})
        // I created the session, so I should be the scribe
        t.deepEqual(sessionInfo.scribe, me_pubkey)
        // First ever session so content should be default content
        t.deepEqual(sessionInfo.snapshot_content, {title:"", body:""})
        let sessionHash = sessionInfo.session;

        // check the hash_content zome call.
        let hash = await me.call('syn', 'hash_content', sessionInfo.snapshot_content)
        t.deepEqual(sessionInfo.content_hash, hash)

        // check get_sessions utility zome call
        sessions = await me.call('syn', 'get_sessions')
        t.equal(sessions.length, 1)
        t.deepEqual(sessions[0],sessionHash)

        // exercise the get_session zome call
        const returnedSessionInfo = await me.call('syn', 'get_session', sessionHash)
        t.equal(sessions.length, 1)
        t.deepEqual(sessionInfo, returnedSessionInfo)

        // check that initial snapshot was created by using the get_content zome call
        const returned_content = await me.call('syn', 'get_content', sessionInfo.content_hash)
        t.deepEqual(returned_content, sessionInfo.snapshot_content)

        // set up the pending deltas array
        let pendingDeltas = [{type:"Title",value: "foo title"}, {type:"Add", value:[0,"bar content"]}]

        let new_content = applyDeltas(sessionInfo.snapshot_content, pendingDeltas)
        const new_content_hash_1 = await me.call('syn', 'hash_content', new_content)

        let deltas = jsonDeltas ? pendingDeltas.map(d=>JSON.stringify(d)) : pendingDeltas;

        // set signal handlers so we can confirm they get sent and received appropriately
        let me_signals : Signal[] = []
        me_player.setSignalHandler((signal) => {
            console.log("Received Signal for me:",signal)
            me_signals.push(signal.data.payload)
        })

        // alice signal handler
        let alice_signals : Signal[] = []
        alice_player.setSignalHandler((signal) => {
            console.log("Received Signal for alice:",signal)
            alice_signals.push(signal.data.payload)
        })

        // bob signal handler
        let bob_signals : Signal[] = []
        bob_player.setSignalHandler((signal) => {
            console.log("Received Signal for bob:",signal)
            bob_signals.push(signal.data.payload)
        })

        // add a content change
        let commit = {
            snapshot: sessionInfo.content_hash,
            change: {
                deltas,
                content_hash: new_content_hash_1,
                previous_change: sessionInfo.content_hash, // this is the first change so same hash as snapshot
                meta: {
                    contributors: [],
                    witnesses: [],
                    app_specific: null
                }
            },
            participants: []
        }
        let commit_header_hash = await me.call('syn', 'commit', commit)
        t.equal(commit_header_hash.length, 39) // is a hash

        // add a second content change
        pendingDeltas = [
          {type:"Delete", value:[0,3]},
          {type:"Add", value:[0,"baz"]},
          {type:"Add", value:[11," new"]},  // 'baz content new'
          {type:"Delete", value:[4,11]},    // 'baz  new'
          {type:"Add", value:[4,"monkey"]}, // 'baz monkey new'
        ]
        new_content = applyDeltas(new_content, pendingDeltas)
        const new_content_hash_2 = await me.call('syn', 'hash_content', new_content)

        deltas = jsonDeltas ? pendingDeltas.map(d=>JSON.stringify(d)) : pendingDeltas;
        commit = {
            snapshot: sessionInfo.content_hash,
            change: {
                deltas,
                content_hash: new_content_hash_2,
                previous_change: new_content_hash_1, // this is the second change so previous commit's hash
                meta: {
                    contributors: [],
                    witnesses: [],
                    app_specific: null
                }
            },
            participants: []
        }
        commit_header_hash = await me.call('syn', 'commit', commit)
        // clear the pendingDeltas
        pendingDeltas = []

        // alice joins session
        const aliceSessionInfo = await alice.call('syn', 'get_session', sessionHash)
        // alice should get my session
        t.deepEqual(aliceSessionInfo.session, sessionHash)
        t.deepEqual(aliceSessionInfo.scribe, me_pubkey)
        t.deepEqual(aliceSessionInfo.snapshot_content, {title:'', body:''})
        await alice.call('syn', 'send_sync_request', {scribe: me_pubkey })

        // check that deltas and snapshot content returned add up to the current real content
        await delay(500) // make time for integrating new data
        const receivedDeltas = jsonDeltas ? aliceSessionInfo.deltas.map(d=>JSON.parse(d)) : aliceSessionInfo.deltas;
        t.deepEqual(
          applyDeltas(aliceSessionInfo.snapshot_content, receivedDeltas),
          {title: "foo title", body: "baz monkey new"} // content after two commits
        )

        // confirm that the session_info's content hash matches the content_hash
        // generated by applying deltas
        hash = await alice.call('syn', 'hash_content', aliceSessionInfo.snapshot_content)
        t.deepEqual(aliceSessionInfo.content_hash, hash)

        // I should receive alice's request for the state as she joins the session
        t.deepEqual(me_signals[0], {signal_name: "SyncReq", signal_payload: alice_pubkey})

        // I add some pending deltas which I will then need to send to Alice as part of her Joining.
        pendingDeltas = [{type:"Title",value: "I haven't committed yet"},{type:"Add", value:[14,"\nBut made a new line! 🍑"]}]

        deltas = jsonDeltas ? pendingDeltas.map(d=>JSON.stringify(d)) : pendingDeltas;

        const state = {
          snapshot: sessionInfo.content_hash,
          commit: commit_header_hash,
          commit_content_hash: new_content_hash_2,
          deltas: deltas,
        }
        await me.call('syn', 'send_sync_response', {
          participant: alice_pubkey,
          state,
        })

        // Alice should have recieved uncommitted deltas
        await delay(500) // make time for signal to arrive
        t.equal(alice_signals[0].signal_name, "SyncResp")
        let receivedState = alice_signals[0].signal_payload;
        t.deepEqual(receivedState, state) // deltas, commit, and snapshot match

        // bob joins session
        const bobSessionInfo = await alice.call('syn', 'get_session', sessionHash)
        // bob should get my session
        t.deepEqual(bobSessionInfo.scribe, me_pubkey)
        await bob.call('syn', 'send_sync_request', {scribe: me_pubkey })

        // alice sends me a change req and I should receive it
        const alice_delta: Delta = {type: "Title", value: "Alice in Wonderland"}
        let delta = jsonDeltas ? JSON.stringify(alice_delta) : alice_delta;
        await alice.call('syn', 'send_change_request', {
            scribe: aliceSessionInfo.scribe,
            change: [1, [delta]]})
        await delay(500) // make time for signal to arrive
        const sig = me_signals[2]
        t.equal(sig.signal_name, "ChangeReq")
        const [sig_index, sig_delta] = sig.signal_payload
        t.equal(sig_index,1)
        const receiveDelta = jsonDeltas ? JSON.parse(sig_delta) : sig_delta;
        t.deepEqual(receiveDelta, alice_delta) // delta_matches


        let my_deltas = [{type: "Add", value:[0, "Whoops!\n"]},{type: "Title", value: "Alice in Wonderland"}];
        deltas = jsonDeltas ? my_deltas.map(d=>JSON.stringify(d)) : deltas;
        // I send a change, and alice and bob should receive it.
        await me.call('syn', 'send_change', {
            participants: [alice_pubkey, bob_pubkey],
            change: [2, deltas]})
        await delay(500) // make time for signal to arrive
        let a_sig = alice_signals[1]
        let b_sig = bob_signals[0]
        t.equal(a_sig.signal_name, "Change")
        t.equal(b_sig.signal_name, "Change")
        t.deepEqual(a_sig.signal_payload, [2, deltas]) // delta_matches
        t.deepEqual(b_sig.signal_payload, [2, deltas]) // delta_matches


        await alice.call('syn', 'send_heartbeat', {
            scribe: me_pubkey,
            data: "Hello"})
        await delay(500) // make time for signal to arrive
        let me_sig = me_signals[3]
        t.equal(me_sig.signal_name, "Heartbeat")
        t.deepEqual(me_sig.signal_payload[1], "Hello")
        t.deepEqual(me_sig.signal_payload[0], alice_pubkey)

        await me.call('syn', 'send_folk_lore', {
            participants: [alice_pubkey, bob_pubkey],
            data: "Alice said hello"})
        await delay(500) // make time for signal to arrive

        a_sig = alice_signals[2]
        b_sig = bob_signals[1]
        t.equal(a_sig.signal_name, "FolkLore")
        t.equal(b_sig.signal_name, "FolkLore")
        t.deepEqual(a_sig.signal_payload, "Alice said hello")
        t.deepEqual(b_sig.signal_payload, "Alice said hello")

        // alice asks for a sync request
        await alice.call('syn', 'send_sync_request', {
            scribe: me_pubkey})
        await delay(500) // make time for signal to arrive
        me_sig = me_signals[4]
        t.equal(me_sig.signal_name, "SyncReq")

        // confirm that all agents got added to the folks anchor
        // TODO figure out why init doesn't happen immediately.
        let folks = await me.call('syn', 'get_folks')
        t.equal(folks.length, 3)

    })
}

/*
  Fake UI functions
    - applyDeltas
      - takes a content and a list of deltas
      - returns the new content with those deltas applied
*/

const applyDeltas = (content, deltas) => {
  for (const delta of deltas) {
    switch(delta.type) {
      case "Title":
        content.title = delta.value
        break
      case "Add":
        const [loc, text] = delta.value
        content.body = content.body.slice(0, loc) + text + content.body.slice(loc)
        break
      case "Delete":
        const [start, end] = delta.value
        content.body = content.body.slice(0, start) + content.body.slice(end)
        break
    }
  }
  return content
}
