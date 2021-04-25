import type { AppWebsocket, HoloHash, InstalledAppInfo } from '@holochain/conductor-api'
import { bufferToBase64 } from '../utils'
export class Zome {
  constructor(public app_ws:AppWebsocket, public app_id:string) {
  }
  agent_pub_key:HoloHash
  appInfo:InstalledAppInfo
  cell_id:[HoloHash, HoloHash]
  dna:HoloHash
  dna_str:string
  me:string

  async attach() {
    // setup the syn instance data
    this.appInfo = await this.app_ws.appInfo({ installed_app_id: this.app_id })
    this.cell_id = this.appInfo.cell_data[0].cell_id
    this.agent_pub_key = this.cell_id[1]
    this.dna = this.cell_id[0]
    this.dna_str = bufferToBase64(this.dna)
    this.me = bufferToBase64(this.agent_pub_key)
  }

  attached() {
    return this.appInfo != undefined
  }

  async call(fn_name:string, payload:any, timeout?:number) {
    if (!this.attached()) {
      console.log('Can\'t call zome when disconnected from conductor')
      return
    }
    try {
      const zome_name = 'syn'
      console.log(`Making zome call ${fn_name} with:`, payload)
      const result = await this.app_ws.callZome(
        {
          cap: null,
          cell_id: this.cell_id,
          zome_name,
          fn_name,
          provenance: this.agent_pub_key,
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
