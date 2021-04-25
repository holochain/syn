import { _b } from '@ctx-core/object'
import type { HoloHash } from '@holochain/conductor-api'
import type { Delta } from './Delta'
import { rpc_b } from './rpc_b'
export const rpc_send_change_b = _b('rpc_send_change', (ctx)=>{
  const rpc = rpc_b(ctx)
  return async function rpc_send_change(
    { index, deltas, participants }:rpc_send_change_params_I
  ):Promise<void> {
    if (participants.length > 0) {
      const delta_json_a1 = deltas.map(d=>JSON.stringify(d))
      return rpc('send_change', {
        participants,
        change: [index, delta_json_a1]
      })
    }
  }
})
export interface rpc_send_change_params_I {
  index:number
  deltas:Delta[]
  participants:HoloHash[]
}
