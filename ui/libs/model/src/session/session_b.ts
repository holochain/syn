import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { session_info_b } from './session_info_b'
export const session_b = _b('session', (ctx) => {
  const session_info = session_info_b(ctx)
  return derived$(session_info, $session_info=>
    $session_info?.session
  )
})
