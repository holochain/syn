import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import * as _ from 'lodash'
import path from 'path'

const delay = ms => new Promise(r => setTimeout(r, ms));

const config = Config.gen();

const dna = path.join(__dirname, '../../syn.dna.gz')

console.log(dna)

const installation: InstallAgentsHapps = [
    // three agents
    [[dna]], // contains 1 dna
    [[dna]], // contains 1 dna
    [[dna]] // contains 1 dna

]

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

module.exports = (orchestrator) => {
    orchestrator.registerScenario('syn basic zome calls', async (s, t) => {
        const [conductor] = await s.players([config])
        const [[me_happ],[alice_happ],[bob_happ]] = await conductor.installAgentsHapps(installation)

        const me = me_happ.cells[0]
        const alice = alice_happ.cells[0]
        const bob = bob_happ.cells[0]

        const me_pubkey = me.cellId[1]
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
            }
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
            }
        }
        commit_header_hash = await me.call('syn', 'commit', commit)

        // set the signal handler so we can confirm what happens when
        // someone joins a sessions
        let flag = false
        conductor.setSignalHandler((signal) => {
            console.log("Received Signal:",signal)
            t.deepEqual(signal.data.payload, {signal_name: "SyncReq"})
            flag = true // FIXME
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

        // I should hear that alice joined the session
        t.equal(flag, true)

        // (send Alice uncommitted deltas)

        // Alice should have recieved uncommitted deltas


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
