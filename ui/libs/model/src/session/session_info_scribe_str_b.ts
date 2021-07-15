import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn/utils'
import { session_info_scribe_b } from './session_info_scribe_b'
export const session_info_scribe_str_b = _b('session_info_scribe_str', (ctx)=>{
    const session_info_scribe = session_info_scribe_b(ctx)
    return derived$(session_info_scribe, $session_info_scribe=>
        $session_info_scribe ? bufferToBase64($session_info_scribe) : null
    )
})
