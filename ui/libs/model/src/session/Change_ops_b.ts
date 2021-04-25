import type { AppSignal } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { next_index_b } from '../delta'
import { am_i_scribe_b } from './am_i_scribe_b'
import { record_deltas_b } from './record_deltas_b'
import type { Ops } from './Ops'
export const Change_ops_b = _b('Change_ops', (ctx)=>{
  const next_index = next_index_b(ctx)
  return {
    Change: async (signal:AppSignal)=>{
      const [index, serialized_deltas] = signal.data.payload.signal_payload
      const deltas = serialized_deltas.map(d=>JSON.parse(d))
      if (am_i_scribe_b(ctx).$ === true) {
        console.log('change received but I\'m the scribe, so I\'m ignoring this!')
      } else {
        console.log(`change arrived for ${index}:`, deltas)
        const $next_index = next_index.$
        if ($next_index === index) {
          record_deltas_b(ctx)(index, deltas)
        } else {
          console.log(`change arrived out of sequence next_index: ${$next_index}, change index:${index}`)
          // TODO either call for sync, or do some waiting algorithm
        }
      }
    }
  } as Ops
})
