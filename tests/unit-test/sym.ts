import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import * as _ from 'lodash'

const delay = ms => new Promise(r => setTimeout(r, ms));

const config = Config.gen();

const dna = path.join(__dirname, 'syn.dna.gz')

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
    const res = await happ.cells[0].call('syn', 'put', {
      path: "/foo/bar",
      content: "baz"
    })
    t.equal(res.length, 39) // is a hash
    const res = await happ.cells[0].call('syn', 'get', "/foo/bar")
    t.equal(res.length, "baz")
  }
}
