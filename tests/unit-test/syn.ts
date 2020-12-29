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
  signal_payload?: StateForSync,
}

module.exports = (orchestrator) => {
    orchestrator.registerScenario('syn basic zome calls', async (s, t) => {
        const [me_player, alice_player, bob_player] = await s.players([config, config, config])
        const [[me_happ]] = await me_player.installAgentsHapps(installation)
        const [[alice_happ]] = await alice_player.installAgentsHapps(installation)
        const [[bob_happ]] = await bob_player.installAgentsHapps(installation)

        await s.shareAllNodes([me_player, alice_player, bob_player]);

        const me = me_happ.cells[0]
        const alice = alice_happ.cells[0]
        const bob = bob_happ.cells[0]

        const me_pubkey = me.cellId[1]x
        const alice_pubkey = alice.cellId[1]
        const bob_pubkey = bob.cellId[1]

        let sessions = await me.call('syn', 'get_sessions')
        t.equal(sessions.length, 0)

        // create initial session
        let sessionInfo = await me.call('syn', 'join_session')
        // I created the session, so I should be the scribe
        t.deepEqual(sessionInfo.scribe, me_pubkey)
        // First ever session so content should be default content
        t.deepEqual(sessionInfo.snapshot_content, {title:"", body:""})

        // check the hash_content zome call.
        let hash = await me.call('syn', 'hash_content', sessionInfo.snapshot_content)
        t.deepEqual(sessionInfo.content_hash, hash)

        // check get_sessions utility zome call
        sessions = await me.call('syn', 'get_sessions')
        t.equal(sessions.length, 1)

        // check that initial snapshot was created by using the get_content zome call
        const returned_content = await me.call('syn', 'get_content', sessionInfo.content_hash)
        t.deepEqual(returned_content, sessionInfo.snapshot_content)

        let deltas = [{type:"Title",value: "foo title"},{type:"Add", value:[0,"bar content"]}]

        let new_content = applyDeltas(sessionInfo.snapshot_content, deltas)
        const new_content_hash_1 = await me.call('syn', 'hash_content', new_content)

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
            }y
        }
        let commit_header_hash = await me.call('syn', 'commit', commit)
        t.equal(commit_header_hash.length, 39) // is a hash

        // add a second content change
        deltas = [
          {type:"Delete", value:[0,3]},
          {type:"Add", value:[0,"baz"]},
          {type:"Add", value:[11," new"]},  // 'baz content new'
          {type:"Delete", value:[4,11]},    // 'baz  new'
          {type:"Add", value:[4,"monkey"]}, // 'baz monkey new'
        ]
        new_content = applyDeltas(new_content, deltas)
        const new_content_hash_2 = await me.call('syn', 'hash_content', new_content)

        commit = {    currentCommitHash = event.detail.contentHash;

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
            }
        }
        commit_header_hash = await me.call('syn', 'commit', commit)

        // set my signal handler so we can confirm what happens when
        // someone joins a sessions
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

        // alice joins session
        const aliceSessionInfo = await alice.call('syn', 'join_session')
        // alice should get my session
        t.deepEqual(aliceSessionInfo.scribe, me_pubkey)

        t.deepEqual(aliceSessionInfo.snapshot_content, {title:'', body:''})

        // check that deltas and snapshot content returned add up to the current real content
        await delay(500) // make time for integrating new data
        t.deepEqual(
          applyDeltas(aliceSessionInfo.snapshot_content, aliceSessionInfo.deltas),
          {title: "foo title", body: "baz monkey new"} // content after two commits
        )

        // confirm that the session_info's content hash matches the content_hash
        // generated by applying deltas
        hash = await alice.call('syn', 'hash_content', aliceSessionInfo.snapshot_content)
        t.deepEqual(aliceSessionInfo.content_hash, hash)

        // I should receive alice's request for the state as she joins the session
        t.deepEqual(me_signals[0], {signal_name: "SyncReq"})

        // (send Alice uncommitted deltas with the Fake UI)
        const uncommittedDeltas = [{type:"Title",value: "I haven't committed yet"},{type:"Add", value:[14,"\nBut made a new line! 🍑"]}]
        const state = {
          snapshot: sessionInfo.content_hash,
          commit: commit_header_hash,
          deltas: uncommittedDeltas,
        }
        await me.call('syn', 'send_sync_response', {
          participant: alice_pubkey,
          state,
        })

        // Alice should have recieved uncommitted deltas
        await delay(500) // make time for signal to arrive
        t.equal(alice_signals[0].signal_name, "SyncResp")
        t.deepEqual(alice_signals[0].signal_payload, state) // deltas, commit, and snapshot match


        // bob joins session
        const bobSessionInfo = await alice.call('syn', 'join_session')
        // bob should get my session
        t.deepEqual(bobSessionInfo.scribe, me_pubkey)

        // alice sends me a change req and I should receive it
        const alice_delta: Delta = {type: "Title", value: "Alice in Wonderland"}
        await alice.call('syn', 'send_change_request', {
            scribe: aliceSessionInfo.scribe,
            delta: alice_delta})
        await delay(500) // make time for signal to arrive
        const sig = me_signals[2]
        t.equal(sig.signal_name, "ChangeReq")
        t.deepEqual(sig.signal_payload, alice_delta) // delta_matches

        const my_deltas = [{type: "Add", value:[0, "Whoops!\n"]},{type: "Title", value: "Alice in Wonderland"}]
        // I send a change, and alice and bob should receive it.
        await me.call('syn', 'send_change', {
            participants: [alice_pubkey, bob_pubkey],
            deltas: my_deltas})
        await delay(500) // make time for signal to arrive
        const a_sig = alice_signals[1]
        const b_sig = bob_signals[0]
        t.equal(a_sig.signal_name, "Change")
        t.equal(b_sig.signal_name, "Change")
        t.deepEqual(a_sig.signal_payload, my_deltas) // delta_matches
        t.deepEqual(b_sig.signal_payload, my_deltas) // delta_matches

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
