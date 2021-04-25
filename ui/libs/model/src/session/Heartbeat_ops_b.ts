import { _b } from '@ctx-core/object'
import type { Ops } from './Ops'
import { decodeJson, FOLK_SEEN } from '@syn-ui/zome-client'
import { am_i_scribe_b } from './am_i_scribe_b'
import { update_folks_b } from './update_folks_b'
export const Heartbeat_ops_b = _b<Ops>('Heartbeat_ops', (ctx)=>{
  const am_i_scribe = am_i_scribe_b(ctx)
  const update_folks = update_folks_b(ctx)
  return {
    Heartbeat: async (signal)=>{
      let [from, jsonData] = signal.data.payload.signal_payload
      const data = decodeJson(jsonData)
      console.log('got heartbeat', data, 'from:', from)
      if (am_i_scribe.$ === true) {
        // I am the scribe and I've recieved a heartbeat from a concerned Folk
        update_folks(from, FOLK_SEEN)
      } else {
        console.log('heartbeat received but I\'m not the scribe.')
      }
    }
  }
})
