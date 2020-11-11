import { Config } from '@holochain/tryorama'
import * as _ from 'lodash'

const delay = ms => new Promise(r => setTimeout(r, ms));

// Configure a conductor with two agents, each with own dna
const config = Config.gen({
  // servicelogger: Config.dna('../servicelogger.dna.gz', null),
  host: Config.dna('../sym-app.dna.gz', null),
});

module.exports = (orchestrator) => {
  orchestrator.registerScenario('FIXME', async (s, t) => {
    const { conductor } = await s.players({ conductor: config })
    await conductor.spawn()
  }
}
