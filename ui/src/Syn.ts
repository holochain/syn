import type { AppWebsocket, HoloHash } from '@holochain/conductor-api'
import { get } from '@ctx-core/store'
import { FolkColors, getFolkColors } from './colors'
import { connection_b } from './connection'
import type { Content } from './content'
import { folks_b } from './folk'
import type { applyDelta_T } from './delta'
import { Zome } from './Zome'
import { Session, session_b, SessionInfo } from './session'
import { scribeStr_b } from './scribe'

declare global {
  interface Window {
    syn:Syn
  }
}

export class Syn {
  constructor(
    public ctx,
    public defaultContent:Content,
    public applyDeltaFn:applyDelta_T,
    public appClient:AppWebsocket,
    public appId:string
  ) {
    window.syn = this
  }
  zome = new Zome(this.appClient, this.appId)
  session = session_b(this.ctx)
  folks = folks_b(this.ctx)
  connection = connection_b(this.ctx)
  scribeStr = scribeStr_b(this.ctx)
  agentPubKey:HoloHash
  me:string
  myColors:FolkColors
  myTag:string
  Dna:string

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

  async getFolks():Promise<HoloHash[]> {
    return this.callZome('get_folks')
  }

  async getSessions():Promise<HoloHash[]> {
    return this.callZome('get_sessions')
  }

  async getSession(session_hash:HoloHash):Promise<SessionInfo> {
    return this.callZome('get_session', session_hash)
  }

  async newSession():Promise<Session> {
    const rawSessionInfo:SessionInfo = await this.callZome(
      'new_session',
      { content: this.defaultContent }
    )
    const $session = new Session(this.ctx, this, rawSessionInfo)
    this.session.set($session)
    return $session
  }

  async sendSyncReq():Promise<{ sessionInfo:SessionInfo }> {
    return this.callZome('send_sync_request', { scribe: get(this.session).scribe })
  }

}
