import { _b, assign } from '@ctx-core/object'
import { Writable$, writable$ } from '@ctx-core/store'
import { rpc_get_sessions_b, SessionInfo } from '@syn-ui/zome-client'
import type { EntryHash } from '@syn-ui/utils'
import { session_info_b } from './session_info_b'
export const sessions_b = _b('sessions', (ctx)=>{
  const sessions = writable$<EntryHash[]|null>(null)
  const busy = writable$<boolean>(false)
  const out_sessions = sessions as sessions_T
  assign(out_sessions, { busy, load, unshift })
  const session_info = session_info_b(ctx)
  let $session_info:SessionInfo|null
  session_info.subscribe(in_$session_info=>{
    if ($session_info && !in_$session_info) {
      sessions.$ = null
    }
    $session_info = in_$session_info
  })
  return out_sessions
  async function load() {
    busy.$ = true
    try {
      const rpc_get_sessions = rpc_get_sessions_b(ctx)
      sessions.$ = await rpc_get_sessions()
    } finally {
      busy.$ = false
    }
    return sessions.$
  }
  function unshift(...session_hash_a1:EntryHash[]) {
    const $sessions = sessions.$ as EntryHash[]
    $sessions.unshift(...session_hash_a1)
    sessions.set($sessions)
    return $sessions
  }
})
export interface sessions_T extends Writable$<EntryHash[]|null> {
  busy:Writable$<boolean>
  load():Promise<EntryHash[]>
  unshift(...session_hash_a1:EntryHash[]):EntryHash[]
}
