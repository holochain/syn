import type { AppWebsocket } from '@holochain/conductor-api'
import { FolkColors, getFolkColors } from './colors'
import { session, connection, folks } from './stores'
import type { SessionInfo } from './SessionInfo'
import type { Content } from './Content'
import type { applyDelta_T } from './ApplyDelta'
import { Zome } from './Zome'
import { Session } from './Session'

export class Syn {
  constructor(
    public defaultContent:Content,
    public applyDeltaFn:applyDelta_T,
    public appClient:AppWebsocket,
    public appId:string
  ) {
  }
  zome = new Zome(this.appClient, this.appId)
  session = session
  folks = folks
  connection = connection
  agentPubKey:Buffer
  me:string
  myColors:FolkColors
  myTag:string
  Dna:string
  _session:Session

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

  clearState() {
    this.folks.set({})
    this.connection.set(undefined)
    this.session.update(s=>{
      s.scribeStr.set('')
      s._content = this.defaultContent
      s.content.set(s._content)
      s.requestedChanges.set([])
      s.recordedChanges.set([])
      s.committedChanges.set([])
      return undefined
    })
  }

  async callZome(fn_name, payload?, timeout?) {
    return this.zome.call(fn_name, payload, timeout)
  }

  async getFolks() {
    return this.callZome('get_folks')
  }

  async getSessions() {
    return this.callZome('get_sessions')
  }

  setSession(sessionInfo:SessionInfo) {
    let s = new Session(this, sessionInfo)
    this._session = s
    this.session.set(s)
    return s
  }

  async getSession(session_hash):Promise<SessionInfo> {
    return this.callZome('get_session', session_hash)
  }

  async newSession():Promise<Session> {
    let rawSessionInfo:SessionInfo = await this.callZome('new_session', { content: this.defaultContent })
    let s = this.setSession(rawSessionInfo)
    return s
  }

  async sendSyncReq() {
    return this.callZome('send_sync_request', { scribe: this._session.scribe })
  }

}
