import { _b } from '@ctx-core/object'
import { derived$, Readable$ } from '@ctx-core/store'
import type { Content } from '@syn-ui/zome-client'
import { session_info_b } from '../session'
export const session_info_snapshot_content_b = _b('session_info_snapshot_content', (ctx)=>{
    const session_info = session_info_b(ctx)
    const snapshot_content:snapshot_content_T = derived$(session_info, $session_info=>
        $session_info?.snapshot_content
    )
    return snapshot_content
})
export interface snapshot_content_T extends Readable$<undefined|Content> {}
