import {AdminWebsocket, AppWebsocket} from '@holochain/conductor-api'
import { getFolkColors } from './colors.js'

import { session, nextIndex, requestedChanges, recordedChanges, committedChanges, connection, scribeStr, content, folks } from './stores.js'


export const arrayBufferToBase64 = buffer => {
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}


export class Syn {
  constructor(appClient, appId) {
    this.appClient = appClient,
    this.appId = appId,
    this.session = session,
    this.folks = folks,
    this.connection = connection
  }

  async attach(appClient, appId) {
    // setup the syn instance data
    this.appInfo = await this.appClient.appInfo({ installed_app_id: this.appId })
    this.cellId = this.appInfo.cell_data[0][0]
    this.agentPubKey = this.cellId[1]
    this.me = arrayBufferToBase64(this.agentPubKey)
    this.myColors = getFolkColors(this.agentPubKey)
    this.myTag = this.me.slice(-4)
    this.Dna = arrayBufferToBase64(this.cellId[0])

    // load up the other folk in this syn instance
    let allFolks = await this.getFolks()
    for (const folk of allFolks) {
      this.updateParticipant(folk)
    }

  }
  fish() { debugger; alert(JSON.stringify(this.content.get())) }
  clearState(contentDefault) {
    this.folks.set({});
    this.connection.set(undefined);
    this.session.update(s => {
      console.log("FISH", s)
      s.content.set(contentDefault);
      s.requestedChanges.set([]);
      s.recordedChanges.set([]);
      s.committedChanges.set([]);
      return undefined
    })
  }

  attached() {
    return this.appInfo != undefined
  }

  async callZome(fn_name, payload, timeout) {
    if (!this.attached()) {
      console.log('callZome called when disconnected from conductor')
      return
    }
    try {
      const zome_name = 'syn'
      console.log(`Making zome call ${fn_name} with:`, payload)
      const result = await this.appClient.callZome(
        {
          cap: null,
          cell_id: this.cellId,
          zome_name,
          fn_name,
          provenance: this.agentPubKey,
          payload
        },
        timeout
      )
      return result
    } catch (error) {
      console.log('ERROR: callZome threw error', error)
      throw(error)
      //  if (error == 'Error: Socket is not open') {
      // TODO        return doResetConnection(dispatch)
      // }
    }
  }
  async getFolks() {
    return this.callZome('get_folks')
  }

  updateParticipant(pubKey, meta) {
    const pubKeyStr = arrayBufferToBase64(pubKey)
    if (pubKeyStr == this.me) {
      return
    }
    this.folks.update( folks => {
      if (!(pubKeyStr in folks)) {
        const colors = getFolkColors(pubKey)
        folks[pubKeyStr] = {pubKey, meta, colors}
      } else if (meta) {
        folks[pubKeyStr].meta = meta
      }
      return folks
    })
  }

  updateFolkLastSeen(pubKey, gone) {
    const pubKeyStr = arrayBufferToBase64(pubKey)
    if (pubKeyStr == this.me) {
      return
    }
    this.updateParticipant(pubKey, undefined)
    if (gone) {
      this.folks.update( f=> {
        f[pubKeyStr].inSession = false
        return f
      })
    } else {
      // see the folk
      this.folks.update( f=> {
        f[pubKeyStr].lastSeen = Date.now()
        f[pubKeyStr].inSession = true
        return f
      })
    }
  }

  async getSessions() {
    return this.callZome('get_sessions')
  }

  setSession(sessionInfo, applyDeltaFn) {
    let s = new Session(sessionInfo, applyDeltaFn, this.myTag)
    this.session.set(s)
    return s
  }

  async getSession(session_hash) {
    return this.callZome('get_session', session_hash)
  }

  async newSession(content, applyDeltaFn) {
    let rawSessionInfo = await this.callZome('new_session', {content})
    let s = this.setSession(rawSessionInfo, applyDeltaFn)
    return s
  }
}

export class Session {
  constructor(sessionInfo, applyDeltaFn, myTag) {
    this.applyDeltaFn = applyDeltaFn
    this.content = content
    this.recordedChanges = recordedChanges
    this.requestedChanges = requestedChanges
    this.committedChanges = committedChanges
    this.scribeStr = scribeStr

    this.sessionHash = sessionInfo.session
    this.scribe = sessionInfo.scribe
    this.snapshot_content = sessionInfo.snapshot_content
    this.snapshot_hash = sessionInfo.snapshot_hash
    this.content_hash = sessionInfo.content_hash

    this.deltas = sessionInfo.deltas.map(d => JSON.parse(d))
    this.snapshotHashStr = arrayBufferToBase64(sessionInfo.snapshot_hash)
    this.contentHashStr = arrayBufferToBase64(sessionInfo.content_hash)
    this.scribeStr.set(arrayBufferToBase64(sessionInfo.scribe))

    console.log('session joined:', sessionInfo)
    const newContent = {... sessionInfo.snapshot_content} // clone so as not to pass by ref
    newContent.meta = {}
    newContent.meta[myTag] = 0

    this.content.set(newContent)

    let changes = []
    for (const delta of this.deltas) {
      changes.push(applyDeltaFn(delta))
    }
    this.committedChanges.update(c => c.concat(changes))
  }

}

export class Connection {
  constructor(appPort, appId, signalHandler) {
    this.appPort = appPort;
    this.appId = appId;
    this.signalHandler = signalHandler;
  }

  async open() {
    this.appClient = await AppWebsocket.connect(
      `ws://localhost:${this.appPort}`,
      this.signalHandler
    )
    console.log('connection established:', this)

    // TODO: in the future we should be able manage and to attach to multiple syn happs
    this.syn = new Syn(this.appClient, this.appId)
    await this.syn.attach(this.appId)

  }

  /* maybe have a create function?
  static async create() {
    const o = new Connection();
    await o.open();
    return o;
  }*/

  /*
  holochainSignalHandler(signal) {
    // ignore signals not meant for me.  This can only happen if there are multiple happs
    // with different agent Ids installed on the same conductor, and will probably be
    // fixed later in holochain in any case
    if (arrayBufferToBase64(signal.data.cellId[1]) != this.me) {
      return
    }
    console.log('Got Signal', signal.data.payload.signal_name, signal)
    switch (signal.data.payload.signal_name) {
    case 'SyncReq':
      syncReq({from: signal.data.payload.signal_payload})
      break
    case 'SyncResp':
      const state = signal.data.payload.signal_payload
      state.deltas = state.deltas.map(d=>JSON.parse(d))
      console.log('post',state)
      syncResp(state)
      break
    case 'ChangeReq':
      {
        let [index, deltas] = signal.data.payload.signal_payload
        deltas = deltas.map(d=>JSON.parse(d))
        changeReq([index, deltas])
        break
      }
    case 'Change':
      {
        let [index, deltas] = signal.data.payload.signal_payload
        deltas = deltas.map(d=>JSON.parse(d))
        change(index, deltas)
        break
      }
    case 'FolkLore':
      {
        let data = decodeJson(signal.data.payload.signal_payload)
        folklore(data)
        break
      }
    case 'Heartbeat':
      {
        let [from, jsonData] = signal.data.payload.signal_payload
        const data = decodeJson(jsonData)
        heartbeat(from, data)
        break
      }
    case 'CommitNotice':
      commitNotice(signal.data.payload.signal_payload)
    }
  }
*/
}
