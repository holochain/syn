import { _b } from '@ctx-core/object'
import { derived$, mix_set_readable$ } from '@ctx-core/store'
import { session_info_b } from './session_info_b'
export const content_hash_b = _b('content_hash', (ctx)=>{
  const session_info = session_info_b(ctx)
  return mix_set_readable$(
    derived$(session_info, $session_info=>{
      return $session_info?.content_hash
    }),
    $content_hash=>{
      session_info.update($session_info=>{
        $session_info.content_hash = $content_hash
        return $session_info
      })
    }
  )
})
