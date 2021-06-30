import { _b } from '@ctx-core/object'
import type { EntryHash } from '@syn-ui/utils'
import { rpc_b } from './rpc_b'
export const rpc_get_sessions_b = _b('rpc_get_sessions', (ctx)=>{
    const rpc = rpc_b(ctx)
    return async function rpc_get_sessions():Promise<EntryHash[]> {
        return await rpc('get_sessions')
    }
})
