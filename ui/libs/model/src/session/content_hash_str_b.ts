import { _b } from '@ctx-core/object'
import { content_hash_b } from './content_hash_b'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn/utils'
export const content_hash_str_b = _b('content_hash_str', (ctx)=>{
    const content_hash = content_hash_b(ctx)
    return derived$(content_hash, $content_hash=>
        $content_hash ? bufferToBase64($content_hash) : null
    )
})
