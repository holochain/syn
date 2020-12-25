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

        let sessions = await happ.cells[0].call('syn', 'get_sessions')
        t.equal(sessions.length, 0)

        let sessionInfo = await happ.cells[0].call('syn', 'join_session')
        t.equal(sessionInfo.scribe.length, 39) // is a hash
        // t.deepEqual(sessionInfo.scribe, me)
        t.deepEqual(sessionInfo.content, {title:"", body:""})

        sessions = await happ.cells[0].call('syn', 'get_sessions')
        t.equal(sessions.length, 1)



        // create an initial snapshot
        const content = {title:"foo", body:"bar"};
        let snapshot_hash = await happ.cells[0].call('syn', 'put_content', content)
        t.equal(snapshot_hash.length, 39) // is a hash
        const hash = await happ.cells[0].call('syn', 'hash_content', content)
        t.deepEqual(snapshot_hash, hash)
        const returned_content = await happ.cells[0].call('syn', 'get_content', snapshot_hash)
        t.deepEqual(returned_content, content)
        // add a content change
        const commit = {
            snapshot: snapshot_hash,
            change: {
                deltas: [],
                previous_change: snapshot_hash, // this is the first change so same hash as snapshot
                meta: {
                    contributors: [],
                    witnesses: [],
                    app_specific: null
                }
            }
        }
        const commit_header_hash = await happ.cells[0].call('syn', 'commit', commit)
        t.equal(commit_header_hash.length, 39) // is a hash

    })
}
