import { _b } from '@ctx-core/object'
import { derived$, Readable$ } from '@ctx-core/store'
import type { HeaderHash } from '@syn/utils/dist'
import { session_info_b } from './session_info_b'
export const session_info_snapshot_hash_b = _b<Readable$<undefined|HeaderHash>>('session_info_snapshot_hash', ctx=>{
    const session_info = session_info_b(ctx)
    return derived$(session_info, $session_info=>
        $session_info?.snapshot_hash
    )
})
