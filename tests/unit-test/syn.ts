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
    const content = {title:"foo", body:"bar"};
    let res = await happ.cells[0].call('syn', 'put_content', {
      content
    })
    t.equal(res.length, 39) // is a hash
    res = await happ.cells[0].call('syn', 'get_content', res)
    t.equal(res.length, content)
  })
}
