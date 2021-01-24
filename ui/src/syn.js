import {AdminWebsocket, AppWebsocket} from '@holochain/conductor-api'
import { getFolkColors } from './colors.js'
import {decodeJson, encodeJson} from './json.js'

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

export class Zome {
  constructor(appClient, appId) {
    this.appClient = appClient
    this.appId = appId
  }

  async attach() {
    // setup the syn instance data
    this.appInfo = await this.appClient.appInfo({ installed_app_id: this.appId })
    this.cellId = this.appInfo.cell_data[0][0]
    this.agentPubKey = this.cellId[1]
    this.dna = this.cellId[0]
    this.dnaStr = arrayBufferToBase64(this.dna)
    this.me = arrayBufferToBase64(this.agentPubKey)
  }

  attached() {
    return this.appInfo != undefined
  }

  async call(fn_name, payload, timeout) {
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

}

export class Syn {
  constructor(defaultContent, applyDeltaFn, appClient, appId) {
    this.defaultContent = defaultContent,
    this.applyDeltaFn = applyDeltaFn,
    this.zome = new Zome(appClient, appId)
    this.session = session,
    this.folks = folks,
    this.connection = connection
  }

  async attach() {
    await this.zome.attach()
    this.agentPubKey = this.zome.agentPubKey
    this.me = this.zome.me
    this.myColors = getFolkColors(this.agentPubKey)
    this.myTag = this.me.slice(-4)
    this.Dna = this.zome.dnaStr

    // TODO: others moved into session so we can do it here.
    // load up the other folk in this syn instance
//    let allFolks = await this.getFolks()
//    for (const folk of allFolks) {
//      this.updateOthers(folk)
//    }

  }

  clearState(contentDefault) {
    this.folks.set({});
    this.connection.set(undefined);
    this.session.update(s => {
      s.scribeStr.set('');
      s.content.set(contentDefault);
      s.requestedChanges.set([]);
      s.recordedChanges.set([]);
      s.committedChanges.set([]);
      return undefined
    })
  }

  async callZome(fn_name, payload, timeout) {
    return this.zome.call(fn_name, payload, timeout)
  }

  async getFolks() {
    return this.callZome('get_folks')
  }

  async getSessions() {
    return this.callZome('get_sessions')
  }

  setSession(sessionInfo) {
    let s = new Session(this.zome, sessionInfo, this.applyDeltaFn)
    this._session = s
    this.session.set(s)
    return s
  }

  async getSession(session_hash) {
    return this.callZome('get_session', session_hash)
  }

  async newSession() {
    let rawSessionInfo = await this.callZome('new_session', {content: this.defaultContent})
    let s = this.setSession(rawSessionInfo, this.applyDeltaFn)
    return s
  }

  async sendSyncReq() {
    return this.callZome('send_sync_request', {scribe: this._session.scribe})
  }

  async sendChangeReq(index, deltas) {
    deltas = deltas.map(d=>JSON.stringify(d))
    return this.callZome('send_change_request', {scribe: this._session.scribe, change: [index, deltas]})
  }

  async sendHeartbeat(data) {
    data = encodeJson(data)
    return this.callZome('send_heartbeat', {scribe: this._session.scribe, data})
  }

  async hashContent(content) {
    return this.callZome('hash_content', content)
  }
}

export const FOLK_SEEN = 1
export const FOLK_GONE = 2
export const FOLK_UNKNOWN = 3
// const outOfSessionTimout = 30 * 1000
const outOfSessionTimout = 8 * 1000 // testing code :)


export class Session {
  constructor(zome, sessionInfo, applyDeltaFn) {
    this.zome = zome
    this.applyDeltaFn = applyDeltaFn
    this.me = zome.me
    this.myTag = zome.me.slice(-4)

    this.content = content
    this.folks = folks
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
    this._scribeStr = arrayBufferToBase64(sessionInfo.scribe)
    this.scribeStr.set(this._scribeStr)

    this.others = {}
    this.folks.update(_ => {return this.others})

    console.log('session joined:', sessionInfo)
    const newContent = {... sessionInfo.snapshot_content} // clone so as not to pass by ref
    newContent.meta = {}
    newContent.meta[this.myTag] = 0

    this.content.set(newContent)

    let changes = []
    for (const delta of this.deltas) {
      changes.push(applyDeltaFn(delta))
    }
    this.committedChanges.update(c => c.concat(changes))
  }

  _recordDelta(delta) {
    // apply the deltas to the content which returns the undoable change
    const undoableChange = this.applyDeltaFn(delta)
    // append changes to the recorded history
    this.recordedChanges.update(h=>[...h, undoableChange])
  }

  _recordDeltas(deltas) {
    // apply the deltas to the content which returns the undoable change
    for (const delta of deltas) {
      this._recordDelta(delta)
    }
  }


  // Folks --------------------------------------------------------

  _newOther(pubKeyStr, pubKey) {
    if (!(pubKeyStr in this.others)) {
      const colors = getFolkColors(pubKey)
      this.others[pubKeyStr] = {pubKey, colors}
    }
  }

  updateOthers(pubKey, status, meta) {
    const pubKeyStr = arrayBufferToBase64(pubKey)
    if (pubKeyStr == this.me) {
      return
    }

    // if we don't have this key, create a record for it
    // including the default color
    this._newOther(pubKeyStr, pubKey)


    if (meta) {
      this.others[pubKeyStr]["meta"] = meta
    }

    switch(status) {
    case FOLK_SEEN:
      this.others[pubKeyStr]["inSession"] = true
      this.others[pubKeyStr]["lastSeen"] = Date.now()
      break;
    case FOLK_GONE:
    case FOLK_UNKNOWN:
      this.others[pubKeyStr]["inSession"] = false
    }

    this.folks.update(f => {return this.others})
  }

  folksForScribeSignals() {
    return Object.values(this.others).filter(v=>v.inSession).map(v=>v.pubKey)
  }

  // updates folks in-session status by checking their last-seen time
  updateRecentlyTimedOutFolks() {
    let result = []
    for (const [pubKeyStr, folk] of Object.entries(this.others)) {
      if (folk.inSession && (Date.now() - this.others[pubKeyStr].lastSeen > outOfSessionTimout)) {
        folk.inSession = false
        result.push(this.others[pubKeyStr].pubKey)
      }
    }
    if (result.length > 0) {
      this.folks.update(f => {return this.others})
    }
    return result
  }


  // senders ---------------------------------------------------------------------
  // These are the functions that send signals in the context of a session

  async sendChange(index, deltas) {
    const participants = this.folksForScribeSignals()
    if (participants.length > 0) {
      deltas = deltas.map(d=>JSON.stringify(d))
      return this.zome.call('send_change', {participants, change: [index, deltas]})
    }
  }

  async sendFolkLore(participants, data) {
    if (participants.length > 0) {
      data = encodeJson(data)
      return this.zome.call('send_folk_lore', {participants, data})
    }
  }

  async sendSyncResp(to, state) {
    state.deltas = state.deltas.map(d=>JSON.stringify(d))
    return this.zome.call('send_sync_response', {
      participant: to,
      state
    })
  }


  // signal handlers ------------------------------------------

  // handler for the syncResp event
  syncResp(stateForSync) {
    // Make sure that we are working off the same snapshot and commit
    const commitContentHashStr = arrayBufferToBase64(stateForSync.commit_content_hash)
    if (commitContentHashStr == this.contentHashStr) {
      this._recordDeltas(stateForSync.deltas)
    } else {
      console.log('WHOA, sync response has different current state assumptions')
      // TODO: resync somehow
    }
  }

  // handler for the heartbeat event
  heartbeat(from, data) {
    console.log('got heartbeat', data, 'from:', from)
    if (this._scribeStr != this.me) {
      console.log("heartbeat received but I'm not the scribe.")
    }
    else {
      // I am the scribe and I've recieved a heartbeat from a concerned Folk
      this.updateOthers(from, FOLK_SEEN)
    }
  }

  // handler for the folklore event
  folklore(data) {
    console.log('got folklore', data)
    if (this._scribeStr == this.me) {
      console.log("folklore received but I'm the scribe!")
    }
    else {
      if (data.gone) {
        Object.values(data.participants).forEach(
          pubKey => {
            this.updateOthers(pubKey, FOLK_GONE)
          }
        )
      }
      // TODO move last seen into p.meta so that we can update that value
      // as hearsay.
      if (data.participants) {
        Object.values(data.participants).forEach(
          p => {
            console.log('p', p)
            this.updateOthers(p.pubKey, FOLK_UNKNOWN, p.meta)
          }
        )
      }
    }
  }

}

export class Connection {
  constructor(appPort, appId, signalHandler) {
    this.appPort = appPort;
    this.appId = appId;
    this.signalHandler = signalHandler;
  }

  async open(defaultContent, applyDeltaFn) {
    this.appClient = await AppWebsocket.connect(
      `ws://localhost:${this.appPort}`,
      this.signalHandler
    )
    console.log('connection established:', this)

    // TODO: in the future we should be able manage and to attach to multiple syn happs
    this.syn = new Syn(defaultContent, applyDeltaFn, this.appClient, this.appId)
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
