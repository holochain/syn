import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { session_info_b } from '../session'
export const snapshot_content_b = _b('snapshot_content', (ctx)=>{
  const session_info = session_info_b(ctx)
  const snapshot_content = derived$(session_info, $session_info=>
    $session_info?.snapshot_content
  )
  return snapshot_content
})
