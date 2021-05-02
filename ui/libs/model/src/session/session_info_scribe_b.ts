import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { session_info_b } from './session_info_b'
export const session_info_scribe_b = _b('session_info_scribe', (ctx)=>{
    const session_info = session_info_b(ctx)
    return derived$(session_info, $session_info=>
        $session_info?.scribe
    )!
})
