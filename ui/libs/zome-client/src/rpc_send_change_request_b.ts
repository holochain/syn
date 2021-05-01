import type { HoloHash } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
import type { Delta } from './Delta'
export const rpc_send_change_request_b = _b('rpc_send_change_request', (ctx)=>{
    const rpc = rpc_b(ctx)
    return async function rpc_send_change_request(
        { index, deltas, scribe }:rpc_send_change_request_params_I
    ):Promise<void> {
        const delta_json_a1 = deltas.map(delta=>JSON.stringify(delta))
        return rpc('send_change_request', {
            scribe,
            change: [
                index,
                delta_json_a1
            ]
        })
    }
})
export interface rpc_send_change_request_params_I {
    index:number
    deltas:Delta[]
    scribe:HoloHash
}
