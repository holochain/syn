import { _b } from '@ctx-core/object'
import type { Delta } from '@syn-ui/zome-client'
import { _scribe_signal_folk_pubKey_a1_b } from './_scribe_signal_folk_pubKey_a1_b'
import { rpc_send_change_b } from '@syn-ui/zome-client'
export const send_change_b = _b('send_change', (ctx)=>{
  const _scribe_signal_folk_pubKey_a1 = _scribe_signal_folk_pubKey_a1_b(ctx)
  const rpc_send_change = rpc_send_change_b(ctx)
  return async function send_change({ index, deltas }:send_change_params_I) {
    const participants = _scribe_signal_folk_pubKey_a1()
    return rpc_send_change({
      index, deltas, participants
    })
  }
})
export interface send_change_params_I {
  index:number
  deltas:Delta[]
}
