import { _b, assign } from '@ctx-core/object'
import { Writable$, writable$ } from '@ctx-core/store'
import { rpc_get_sessions_b } from '@syn-ui/zome-client'
import type { EntryHash } from '@syn-ui/utils'
export const sessions_b = _b('sessions', (ctx)=>{
  const rpc_get_sessions = rpc_get_sessions_b(ctx)
  const sessions = writable$<EntryHash[]>(null)
  const busy = writable$<boolean>(false)
  const out_sessions = sessions as sessions_T
  assign(out_sessions, { busy, load, unshift })
  load().then()
  return out_sessions
  async function load() {
    busy.$ = true
    try {
      sessions.$ = await rpc_get_sessions()
    } finally {
      busy.$ = false
    }
    return sessions.$
  }
  function unshift(...session_hash_a1:EntryHash[]) {
    const $sessions = sessions.$
    $sessions.unshift(...session_hash_a1)
    sessions.set($sessions)
    return $sessions
  }
})
export interface sessions_T extends Writable$<EntryHash[]> {
  busy:Writable$<boolean>
  load():Promise<EntryHash[]>
  unshift(...session_hash_a1:EntryHash[]):EntryHash[]
}
