import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { me_b } from '@syn-ui/zome-client'
import { scribe_str_b } from './scribe_str_b'
export const am_i_scribe_b = _b('am_i_scribe', (ctx)=>{
    const scribe_str = scribe_str_b(ctx)
    const me = me_b(ctx)
    return derived$(([scribe_str, me]), ([$scribe_str, $me])=>
        $scribe_str ? $scribe_str === $me : null
    )
})
