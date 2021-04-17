import { AppSignal, AppWebsocket } from '@holochain/conductor-api'
import type { Session } from './Session'
import type { Content } from './Content'
import type { applyDelta_T } from './ApplyDelta'
import { bufferToBase64, decodeJson } from './utils'
import { Syn } from './Syn'
export class Connection {
  constructor(public appPort:number, public appId:string) {
  }
  appClient:AppWebsocket
  session:Session
  sessions:Buffer[]
  syn:Syn

  async open(defaultContent:Content, applyDeltaFn:applyDelta_T) {
    const self = this
    this.appClient = await AppWebsocket.connect(
      `ws://localhost:${this.appPort}`,
      30000,
      (signal)=>signalHandler(self, signal))

    console.log('connection established:', this)

    // TODO: in the future we should be able manage and to attach to multiple syn happs
    this.syn = new Syn(defaultContent, applyDeltaFn, this.appClient, this.appId)
    await this.syn.attach()
    this.sessions = await this.syn.getSessions()
  }

  async joinSession() {
    if (!this.syn) {
      console.log('join session called without syn app opened')
      return
    }
    if (this.sessions.length == 0) {
      this.session = await this.syn.newSession()
      this.sessions[0] = this.session.sessionHash
    } else {
      const sessionInfo = await this.syn.getSession(this.sessions[0])
      this.session = this.syn.setSession(sessionInfo)
      if (this.session._scribeStr != this.syn.me) {
        await this.syn.sendSyncReq()
      }
    }
  }
}

function signalHandler(connection:Connection, signal:AppSignal) {
  // ignore signals not meant for me
  if (!connection.syn || bufferToBase64(signal.data.cellId[1]) != connection.syn.me) {
    return
  }
  console.log('Got Signal', signal.data.payload.signal_name, signal)
  switch (signal.data.payload.signal_name) {
    case 'SyncReq':
      connection.session.syncReq({ from: signal.data.payload.signal_payload })
      break
    case 'SyncResp':
      const state = signal.data.payload.signal_payload
      state.deltas = state.deltas.map(d=>JSON.parse(d))
      connection.session.syncResp(state)
      break
    case 'ChangeReq': {
      let [index, deltas] = signal.data.payload.signal_payload
      deltas = deltas.map(d=>JSON.parse(d))
      connection.session.changeReq([index, deltas])
      break
    }
    case 'Change': {
      let [index, deltas] = signal.data.payload.signal_payload
      deltas = deltas.map(d=>JSON.parse(d))
      connection.session.change(index, deltas)
      break
    }
    case 'FolkLore': {
      let data = decodeJson(signal.data.payload.signal_payload)
      connection.session.folklore(data)
      break
    }
    case 'Heartbeat': {
      let [from, jsonData] = signal.data.payload.signal_payload
      const data = decodeJson(jsonData)
      connection.session.heartbeat(from, data)
      break
    }
    case 'CommitNotice':
      connection.session.commitNotice(signal.data.payload.signal_payload)
  }
}
