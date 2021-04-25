import { _b, assign } from '@ctx-core/object'
import { derived$, Readable } from '@ctx-core/store'
import { session_info_b } from './session_info_b'
import type { Readable$ } from '@ctx-core/store/src/readable$'
import type { EntryHash } from '@syn-ui/utils'
import { mix_writable$ } from '@ctx-core/store/src/writable$'
export const content_hash_b = _b('content_hash', (ctx)=>{
  const session_info = session_info_b(ctx)
  return mix_writable$(mix_readable_set(derived$(session_info, $session_info=>
    $session_info?.content_hash
  ), $content_hash=>session_info.update($session_info=>{
    $session_info.content_hash = $content_hash
    return $session_info
  })))
})
export interface content_hash_I extends Readable$<EntryHash> {

}
export interface mix_readable_set_I<Val extends unknown = unknown> extends Readable<Val> {
  set(val:Val):void
}
export function mix_readable_set<Val extends unknown = unknown>(
  store:Readable<Val>, set:(val:Val)=>void
):mix_readable_set_I<Val> {
  return assign(store as mix_readable_set_I<Val>, {
    set
  })
}
