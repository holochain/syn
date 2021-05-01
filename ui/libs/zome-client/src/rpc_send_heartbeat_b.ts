import type { HoloHash } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
export const rpc_send_heartbeat_b = _b('rpc_send_heartbeat', (ctx)=>{
    const rpc = rpc_b(ctx)
    return function rpc_send_heartbeat({ scribe, data }:rpc_send_heartbeat_params_I) {
        return rpc('send_heartbeat', { scribe, data })
    }
})
export interface rpc_send_heartbeat_params_I {
    scribe:HoloHash
    data:string
}
