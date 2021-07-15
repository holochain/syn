import { _b } from '@ctx-core/object'
import { decodeJson, FOLK_GONE, FOLK_UNKNOWN } from '@syn/zome-client'
import { console_b } from '@syn/utils'
import { am_i_scribe_b, update_folks_b } from '../session'
import type { SignalOps } from './SignalOps'
export const FolkLore_SignalOps_b = _b<SignalOps>('FolkLore_SignalOps', (ctx)=>{
    const console = console_b(ctx)
    const am_i_scribe = am_i_scribe_b(ctx)
    const update_folks = update_folks_b(ctx)
    return {
        FolkLore: async (signal)=>{
            const data = decodeJson(signal.data.payload.signal_payload)
            console.log('got folklore', data)
            if (am_i_scribe.$) {
                console.log(`folklore received but I'm the scribe!`)
            } else {
                const { gone, participants } = data
                if (gone) {
                    for (const pubKey of gone) {
                        update_folks(pubKey, FOLK_GONE)
                    }
                }
                // TODO move last seen into p.meta so that we can update that value
                // as hearsay.
                if (participants) {
                    Object.values(participants).forEach(
                        p=>{
                            update_folks(p.pubKey, FOLK_UNKNOWN, p.meta)
                        }
                    )
                }
            }
        }
    }
})
