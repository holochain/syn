import { _b } from '@ctx-core/object'
import { derived$, mix_set_readable$ } from '@ctx-core/store'
import type { SessionInfo } from '@syn-ui/zome-client'
import { session_info_b } from './session_info_b'
import type { EntryHash } from '@syn-ui/utils/dist'
export const content_hash_b = _b('content_hash', (ctx)=>{
  const session_info = session_info_b(ctx)
  return mix_set_readable$(
    derived$(session_info, $session_info=>{
      return $session_info?.content_hash
    }),
    $content_hash=>{
      session_info.update($session_info=>{
        ($session_info as SessionInfo).content_hash = $content_hash as EntryHash
        return $session_info
      })
    }
  )
})
