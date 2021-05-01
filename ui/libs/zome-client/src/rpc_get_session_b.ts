import { _b } from '@ctx-core/object'
import type { EntryHash } from '@syn-ui/utils'
import { rpc_b } from './rpc_b'
import type { SessionInfo } from './SessionInfo'
export const rpc_get_session_b = _b('rpc_get_session', (ctx)=>{
    const rpc = rpc_b(ctx)
    return async function rpc_get_session(session_hash:EntryHash):Promise<SessionInfo> {
        return rpc('get_session', session_hash)
    }
})
