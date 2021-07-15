import { _b } from '@ctx-core/object'
import { FOLK_SEEN } from '@syn/zome-client'
import { console_b } from '@syn/utils'
import { am_i_scribe_b, update_folks_b } from '../session'
import type { SignalOps } from './SignalOps'
export const Heartbeat_SignalOps_b = _b<SignalOps>('Heartbeat_SignalOps', (ctx)=>{
    const console = console_b(ctx)
    const am_i_scribe = am_i_scribe_b(ctx)
    const update_folks = update_folks_b(ctx)
    return {
        Heartbeat: async (signal)=>{
            let [from, msg] = signal.data.payload.signal_payload
            console.log('got heartbeat', msg, 'from:', from)
            if (am_i_scribe.$ === true) {
                // I am the scribe and I've received a heartbeat from a concerned Folk
                update_folks(from, FOLK_SEEN)
            } else {
                console.log(`heartbeat received but I'm not the scribe.`)
            }
        }
    }
})
