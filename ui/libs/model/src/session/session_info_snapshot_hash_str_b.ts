import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn-ui/utils'
import { session_info_snapshot_hash_b } from './session_info_snapshot_hash_b'
export const session_info_snapshot_hash_str_b = _b('session_info_snapshot_hash_str', (ctx)=>{
    const session_info_snapshot_hash = session_info_snapshot_hash_b(ctx)
    return derived$(session_info_snapshot_hash, $session_info_snapshot_hash=>
        $session_info_snapshot_hash ? bufferToBase64($session_info_snapshot_hash) : null
    )
})
