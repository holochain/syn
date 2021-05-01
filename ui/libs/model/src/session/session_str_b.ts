import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn-ui/utils'
import { session_b } from './session_b'
export const session_str_b = _b('session_str', (ctx) => {
  const session = session_b(ctx)
  return derived$(session, $session=>
    $session ? bufferToBase64($session) : undefined
  )
})
