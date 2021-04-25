import { _b } from '@ctx-core/object'
import type { Delta } from '@syn-ui/zome-client'
import { am_i_scribe_b } from './am_i_scribe_b'
import { next_index_b, send_change_b } from '../delta'
import { record_deltas_b } from './record_deltas_b'
import type { Ops } from './Ops'
export const ChangeReq_ops_b = _b<Ops>('ChangeReq_ops', (ctx)=>{
  const am_i_scribe = am_i_scribe_b(ctx)
  const next_index = next_index_b(ctx)
  const send_change = send_change_b(ctx)
  return {
    ChangeReq: async (signal)=>{
      const [index, serialized_deltas]:[number, string[]] = signal.data.payload.signal_payload
      const deltas:Delta[] = serialized_deltas.map(d=>JSON.parse(d))
      const change:[number, Delta[]] = [index, deltas]
      if (am_i_scribe.$ === true) {
        let [index, deltas] = change
        const $next_index = next_index.$
        if ($next_index != index) {
          console.log('Scribe is receiving change out of order!')
          console.log(`next_index: ${$next_index}, changeIndex:${index} for deltas:`, deltas)
          if (index < $next_index) {
            // change is too late, $next_index has moved on
            // TODO: rebase? notify sender?
            return
          } else {
            // change is in the future, possibly some other change was dropped or is slow in arriving
            // TODO: wait a bit?  Ask sender for other changes?
            return
          }
        }
        record_deltas_b(ctx)(index, deltas)
        // notify all participants of the change
        await send_change({ index, deltas })
      }
      // connection.session.changeReq([index, deltas])
    }
  }
})
