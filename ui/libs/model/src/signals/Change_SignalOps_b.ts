import type { AppSignal } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { next_index_b, record_deltas_b } from '../delta'
import { am_i_scribe_b } from '../session'
import type { SignalOps } from './SignalOps'
export const Change_SignalOps_b = _b<SignalOps>('Change_SignalOps', (ctx)=>{
  const next_index = next_index_b(ctx)
  return {
    Change: async (signal:AppSignal)=>{
      const [index, serialized_deltas] = signal.data.payload.signal_payload
      const deltas = serialized_deltas.map(d=>JSON.parse(d))
      const am_i_scribe = am_i_scribe_b(ctx)
      if (am_i_scribe.$ === true) {
        console.log('change received but I\'m the scribe, so I\'m ignoring this!')
      } else {
        console.log(`change arrived for ${index}:`, deltas)
        const $next_index = next_index.$
        if ($next_index === index) {
          const record_deltas = record_deltas_b(ctx)
          record_deltas(index, deltas)
        } else {
          console.log(`change arrived out of sequence next_index: ${$next_index}, change index:${index}`)
          // TODO either call for sync, or do some waiting algorithm
        }
      }
    }
  }
})
