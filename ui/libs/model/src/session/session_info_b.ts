import { _b, assign } from '@ctx-core/object'
import { writable$, Writable$ } from '@ctx-core/store'
import { rpc_get_session_b, SessionInfo } from '@syn/zome-client'
export const session_info_b = _b<session_info_I>('session_info', (ctx)=>{
    const rpc_get_session = rpc_get_session_b(ctx)
    const session_info = assign(writable$<$session_info_T>(undefined), {
        refresh
    })
    return session_info
    async function refresh() {
        const $session_info = session_info.$
        if ($session_info) {
            await rpc_get_session($session_info.session)
        }
    }
})
export type $session_info_T = undefined|SessionInfo
export interface session_info_I extends Writable$<$session_info_T> {
    refresh():Promise<void>
}
