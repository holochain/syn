import type { AppWebsocket, HoloHash } from '@holochain/conductor-api'
import { Zome, connection_b } from '@syn-ui/zome-client'
import { FolkColors, getFolkColors } from '../colors'
import type { Content } from '../content'
import { folks_b } from '../folk'
import type { apply_delta_fn_T } from '../delta'
import { Session, session_b, SessionInfo } from '../session'
import { scribe_str_b } from '../scribe'

declare global {
  interface Window {
    syn:Syn
  }
}

export class Syn {
  constructor(
    public ctx,
    public default_content:Content,
    public applyDeltaFn:apply_delta_fn_T,
    public app_ws:AppWebsocket,
    public app_id:string
  ) {
    window.syn = this
  }
  zome = new Zome(this.app_ws, this.app_id)
  session = session_b(this.ctx)
  folks = folks_b(this.ctx)
  connection = connection_b(this.ctx)
  scribe_str = scribe_str_b(this.ctx)
  agent_pub_key:HoloHash
  me:string
  my_colors:FolkColors
  my_tag:string
  Dna:string

  async attach() {
    await this.zome.attach()
    this.agent_pub_key = this.zome.agent_pub_key
    this.me = this.zome.me
    this.my_colors = getFolkColors(this.agent_pub_key)
    this.my_tag = this.me.slice(-4)
    this.Dna = this.zome.dna_str

    // TODO: others moved into session so we can do it here.
    // load up the other folk in this syn instance
//    let allFolks = await this.getFolks()
//    for (const folk of allFolks) {
//      this.update_folks(folk)
//    }

  }

  clearState() {
    this.folks.set({})
    this.connection.set(undefined)
    this.session.update(s=>{
      s.scribe_str.set('')
      s._content = this.default_content
      s.content.set(s._content)
      s.requested_changes.set([])
      s.recorded_changes.set([])
      s.committed_changes.set([])
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
      { content: this.default_content }
    )
    const $session = new Session(this.ctx, this, rawSessionInfo)
    this.session.set($session)
    return $session
  }

  async sendSyncReq():Promise<{ sessionInfo:SessionInfo }> {
    return this.callZome('send_sync_request', { scribe: this.session.$.scribe })
  }

}
