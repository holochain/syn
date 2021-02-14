import {Connection} from './../../ui/src/syn'
import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import { HoloHash } from '@holochain/conductor-api'
import * as _ from 'lodash'
import path from 'path'
import {delay, Delta, Signal, StateForSync} from '../common'

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

// Delta representation could be JSON or not, for now we are using
// json so setting this variable to true
const jsonDeltas = true;

export const oFn = (orchestrator) => {
    orchestrator.registerScenario('syn connect', async (s, t) => {
        const [me_player] = await s.players([config])
        const [[me_happ]] = await me_player.installAgentsHapps(installation)
        const appPort = me_player._conductor.appClient.client.socket._url.split(":")[2];
        const c = new Connection(appPort, me_happ.hAppId)
        t.equal(c.appPort, appPort)
        t.equal(c.appId, me_happ.hAppId)
        t.equal(c.sessions.length, 0)
        t.equal(c.syn, undefined)
        t.equal(c.appClient, undefined)

        const defaultContent = {title:'', body:''}
        await c.open(defaultContent, () => {})
        t.notEqual(c.appClient, undefined)
        t.deepEqual(c.syn.defaultContent, defaultContent)
    })
}
