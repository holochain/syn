import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import * as _ from 'lodash'
import path from 'path'

const delay = ms => new Promise(r => setTimeout(r, ms));

const config = Config.gen();

const dna = path.join(__dirname, '../../syn.dna.gz')

console.log(dna)

const installation: InstallAgentsHapps = [
    // agent 0
    [
        // happ 0
        [dna] // contains 1 dna
    ]
]

module.exports = (orchestrator) => {
    orchestrator.registerScenario('syn basic zome calls', async (s, t) => {
        const [conductor] = await s.players([config])
        const [[happ]] = await conductor.installAgentsHapps(installation)

        const me = happ.cells[0].cellId[1]
        let sessions = await happ.cells[0].call('syn', 'get_sessions')
        t.equal(sessions.length, 0)

        // create initial session
        let sessionInfo = await happ.cells[0].call('syn', 'join_session')
        // I created the session, so I should be the scribe
        t.deepEqual(sessionInfo.scribe, me)
        // First ever session so content should be default content
        t.deepEqual(sessionInfo.content, {title:"", body:""})

        // check the hash_content zome call.
        const hash = await happ.cells[0].call('syn', 'hash_content', sessionInfo.content)
        t.deepEqual(sessionInfo.content_hash, hash)

        // check get_sessions utility zome call
        sessions = await happ.cells[0].call('syn', 'get_sessions')
        t.equal(sessions.length, 1)

        // check that initial snapshot was created by using the get_content zome call
        const returned_content = await happ.cells[0].call('syn', 'get_content', sessionInfo.content_hash)
        t.deepEqual(returned_content, sessionInfo.content)

        // add a content change
        const commit = {
            snapshot: sessionInfo.content_hash,
            change: {
                deltas: [],
                previous_change: sessionInfo.content_hash, // this is the first change so same hash as snapshot
                meta: {
                    contributors: [],
                    witnesses: [],
                    app_specific: null
                }
            }
        }
        const commit_header_hash = await happ.cells[0].call('syn', 'commit', commit)
        t.equal(commit_header_hash.length, 39) // is a hash


        /*        // create an initial snapshot
                  const content = {title:"foo", body:"bar"};
                  let snapshot_hash = await happ.cells[0].call('syn', 'put_content', content)
                  t.equal(snapshot_hash.length, 39) // is a hash
        */



    })
}
