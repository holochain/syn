import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import type { Delta } from '@syn-ui/zome-client'
import { session_info_b } from '../session'
export const deltas_b = _b('deltas', (ctx)=>{
  const session_info = session_info_b(ctx)
  return derived$(session_info, $session_info=>
    $session_info ? $session_info.deltas.map(
      serialized_delta=>JSON.parse(serialized_delta)
    ) as Delta[] : null
  )
})
