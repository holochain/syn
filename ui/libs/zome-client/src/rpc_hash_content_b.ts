import { _b } from '@ctx-core/object'
import type { EntryHash } from '@syn/utils'
import type { Content } from './Content'
import { rpc_b } from './rpc_b'
export const rpc_hash_content_b = _b('rpc_hash_content', (ctx)=>{
    const rpc = rpc_b(ctx)
    return async function rpc_hash_content(content:Content):Promise<EntryHash> {
        return rpc('hash_content', content)
    }
})
