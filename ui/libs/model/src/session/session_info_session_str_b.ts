import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn-ui/utils'
import { session_info_session_b } from './session_info_session_b'
export const session_info_session_str_b = _b('session_info_session_str', (ctx)=>{
    const session = session_info_session_b(ctx)
    return derived$(session, $session=>
        $session ? bufferToBase64($session) : undefined
    )
})
