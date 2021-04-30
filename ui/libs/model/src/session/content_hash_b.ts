import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import { session_info_b } from './session_info_b'
import type { EntryHash } from '@syn-ui/utils/dist'
export const content_hash_b = _b('content_hash', (ctx)=>{
  const session_info = session_info_b(ctx)
  const content_hash = writable$<undefined|EntryHash>(undefined)
  session_info.subscribe($session_info=>{
    content_hash.$ = $session_info?.content_hash
  })
  return content_hash
})
