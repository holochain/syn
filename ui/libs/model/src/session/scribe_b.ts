import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn-ui/utils'
import { session_info_b } from './session_info_b'
export const scribe_b = _b('scribe', (ctx)=>{
  const session_info = session_info_b(ctx)
  return derived$(session_info, $session_info=>
    $session_info ? bufferToBase64($session_info.scribe) : null
  )
})
