import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn-ui/utils'
import { scribe_b } from './scribe_b'
export const scribe_str_b = _b('scribe_str', (ctx)=>{
    const scribe = scribe_b(ctx)
    return derived$(scribe, $scribe=>
        $scribe ? bufferToBase64($scribe) : null
    )
})
