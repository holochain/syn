import path from 'path'
import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import { Content, me_b, PubKeyToFolkRecord } from '@syn-ui/zome-client'
import { folks_b, join_session, scribe_str_b } from '@syn-ui/model'
import { delay } from '../common'

const config = Config.gen()

const dna = path.join(__dirname, '../../syn.dna')

console.log(dna)

const installation:InstallAgentsHapps = [
  // one agents
  [[dna]], // contains 1 dna
]

process.on('unhandledRejection', error=>{
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error)
})

// Delta representation could be JSON or not, for now we are using
// json so setting this variable to true
const jsonDeltas = true
export const oFn = (orchestrator)=>{
  const default_content:Content = { title: '', body: '', meta: {} }
  /*    orchestrator.registerScenario('syn connect', async (s, t) => {
          const [me_player] = await s.players([config])
          const [[me_happ]] = await me_player.installAgentsHapps(installation)
          const app_port = me_player._conductor.app_ws.client.socket._url.split(":")[2];
          const c = new Connection(app_port, me_happ.hAppId)
          t.equal(c.app_port, app_port)
          t.equal(c.app_id, me_happ.hAppId)
          t.equal(c.sessions.length, 0)
          t.equal(c.syn, undefined)
          t.equal(c.app_ws, undefined)

          await c.open(default_content, () => {})
          t.notEqual(c.app_ws, undefined)
          t.deepEqual(c.syn.default_content, default_content)
      })*/
  orchestrator.registerScenario('syn 2 nodes', async (s, t)=>{
    const [player1, player2] = await s.players([config, config])
    const [[syn1]] = await player1.installAgentsHapps(installation)
    const [[syn2]] = await player2.installAgentsHapps(installation)
    await s.shareAllNodes([player1, player2])
    const appPort1:number = player1._conductor.app_ws.client.socket._url.split(':')[2]
    const appPort2:number = player2._conductor.app_ws.client.socket._url.split(':')[2]
    const c1 = await join_session({
      app_port: appPort1, app_id: syn1.hAppId,
    })
    // const c1 = new Connection({}, appPort1, syn1.hAppId)
    // await c1.open(default_content, applyDeltas)
    // await c1.joinSession()
    const c2 = await join_session({
      app_port: appPort2, app_id: syn2.hAppId,
    })
    // const c2 = new Connection({}, appPort2, syn2.hAppId)
    // await c2.open(default_content, applyDeltas)
    // await c2.joinSession()
    const c1_me = me_b(c1)
    t.equal(c1_me.$, scribe_str_b(c2).$)
    const c2_folks = folks_b(c2)
    while (true) {
      const $c2_folks = c2_folks.$ as PubKeyToFolkRecord
      const others = Object.keys($c2_folks)
      if (others.length > 0) {
        t.equal($c2_folks[others[0]].pubKey.toString('base64'), c1_me.$)
        break
      } else {
        await delay(1000)
      }
    }
  })
}
