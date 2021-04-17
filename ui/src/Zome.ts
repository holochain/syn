import type { AppWebsocket, InstalledAppInfo } from '@holochain/conductor-api'
import { bufferToBase64 } from './utils'
export class Zome {
  constructor(public appClient:AppWebsocket, public appId:string) {
  }
  agentPubKey:Buffer
  appInfo:InstalledAppInfo
  cellId:[Buffer, Buffer]
  dna:Buffer
  dnaStr:string
  me:string

  async attach() {
    // setup the syn instance data
    this.appInfo = await this.appClient.appInfo({ installed_app_id: this.appId })
    this.cellId = this.appInfo.cell_data[0].cell_id
    this.agentPubKey = this.cellId[1]
    this.dna = this.cellId[0]
    this.dnaStr = bufferToBase64(this.dna)
    this.me = bufferToBase64(this.agentPubKey)
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
