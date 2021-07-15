import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { me_b } from '@syn/zome-client'
import { session_info_scribe_str_b } from './session_info_scribe_str_b'
export const am_i_scribe_b = _b('am_i_scribe', (ctx)=>{
    const session_info_scribe_str = session_info_scribe_str_b(ctx)
    const me = me_b(ctx)
    return derived$(([session_info_scribe_str, me]), ([$session_info_scribe_str, $me])=>
        $session_info_scribe_str ? $session_info_scribe_str === $me : null
    )
})
