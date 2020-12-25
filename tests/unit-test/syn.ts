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

module.exports = (orchestrator) => {
    orchestrator.registerScenario('syn basic zome calls', async (s, t) => {
        const [conductor] = await s.players([config])
        const [[happ],[alice],[bob]] = await conductor.installAgentsHapps(installation)

        const me_pubkey = happ.cells[0].cellId[1]
        const alice_pubkey = alice.cells[0].cellId[1]
        const bob_pubkey = bob.cells[0].cellId[1]
        const me_happ = happ.cells[0]
        const alice_happ = alice.cells[0]
        const bob_happ = bob.cells[0]

        let sessions = await me_happ.call('syn', 'get_sessions')
        t.equal(sessions.length, 0)

        // create initial session
        let sessionInfo = await me_happ.call('syn', 'join_session')
        // I created the session, so I should be the scribe
        t.deepEqual(sessionInfo.scribe, me_pubkey)
        // First ever session so content should be default content
        t.deepEqual(sessionInfo.content, {title:"", body:""})

        // check the hash_content zome call.
        const hash = await me_happ.call('syn', 'hash_content', sessionInfo.content)
        t.deepEqual(sessionInfo.content_hash, hash)

        // check get_sessions utility zome call
        sessions = await me_happ.call('syn', 'get_sessions')
        t.equal(sessions.length, 1)

        // check that initial snapshot was created by using the get_content zome call
        const returned_content = await me_happ.call('syn', 'get_content', sessionInfo.content_hash)
        t.deepEqual(returned_content, sessionInfo.content)

        // add a content change
        const commit = {
            snapshot: sessionInfo.content_hash,
            change: {
                deltas: [{type:"Title",content: "foo title"},{type:"Add", content:[0,"bar content"]}],
                previous_change: sessionInfo.content_hash, // this is the first change so same hash as snapshot
                meta: {
                    contributors: [],
                    witnesses: [],
                    app_specific: null
                }
            }
        }
        const commit_header_hash = await me_happ.call('syn', 'commit', commit)
        t.equal(commit_header_hash.length, 39) // is a hash


        /*        // create an initial snapshot
                  const content = {title:"foo", body:"bar"};
                  let snapshot_hash = await me_happ.call('syn', 'put_content', content)
                  t.equal(snapshot_hash.length, 39) // is a hash
        */



    })
}
