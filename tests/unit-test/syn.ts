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
    orchestrator.registerScenario('FIXME', async (s, t) => {
        const [conductor] = await s.players([config])
        const [[happ]] = await conductor.installAgentsHapps(installation)

        // create an initial snapshot
        const content = {title:"foo", body:"bar"};
        let snapshot_hash = await happ.cells[0].call('syn', 'put_content', content)
        t.equal(snapshot_hash.length, 39) // is a hash
        console.log("BOINK",snapshot_hash)
        const returned_content = await happ.cells[0].call('syn', 'get_content', snapshot_hash)
        console.log("FISH:",returned_content)
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
        const res = await happ.cells[0].call('syn', 'commit', commit)
        console.log("COW:",res)


    })
}
