import { _b } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
import type { HoloHash } from '@holochain/conductor-api'
export const rpc_get_folks_b = _b('rpc_get_folks', (ctx)=>{
    const rpc = rpc_b(ctx)
    return async function rpc_get_folks():Promise<HoloHash[]> {
        return await rpc('get_folks')
    }
})
