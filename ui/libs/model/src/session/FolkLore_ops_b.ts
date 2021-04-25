import { _b } from '@ctx-core/object'
import { decodeJson, FOLK_GONE, FOLK_UNKNOWN } from '@syn-ui/zome-client'
import { am_i_scribe_b } from './am_i_scribe_b'
import { update_folks_b } from './update_folks_b'
import type { Ops } from './Ops'
export const FolkLore_ops_b = _b<Ops>('FolkLore_ops', (ctx)=>{
  const am_i_scribe = am_i_scribe_b(ctx)
  const update_folks = update_folks_b(ctx)
  return {
    FolkLore: async (signal)=>{
      const data = decodeJson(signal.data.payload.signal_payload)
      console.log('got folklore', data)
      if (am_i_scribe.$) {
        console.log('folklore received but I\'m the scribe!')
      } else {
        if (data.gone) {
          Object.values(data.participants).forEach(
            pubKey=>{
              update_folks(pubKey, FOLK_GONE)
            }
          )
        }
        // TODO move last seen into p.meta so that we can update that value
        // as hearsay.
        if (data.participants) {
          Object.values(data.participants).forEach(
            p=>{
              update_folks(p.pubKey, FOLK_UNKNOWN, p.meta)
            }
          )
        }
      }
    }
  }
})
