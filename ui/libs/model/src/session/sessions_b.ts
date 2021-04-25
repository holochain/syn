import type { HoloHash } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { Writable$, writable$ } from '@ctx-core/store'
import { rpc_get_sessions_b } from '@syn-ui/zome-client'
import { assign } from 'svelte/internal'
export const sessions_b = _b('sessions', (ctx)=>{
  const rpc_get_sessions = rpc_get_sessions_b(ctx)
  const sessions = writable$<HoloHash[]>(null)
  const busy = writable$<boolean>(false)
  load().then()
  const out_sessions = sessions as sessions_T
  assign(out_sessions, { busy, load, unshift })
  return out_sessions
  async function load() {
    busy.set(true)
    try {
      return await rpc_get_sessions()
    } finally {
      busy.set(false)
    }
  }
  function unshift(...session_hash_a1:HoloHash[]) {
    const $sessions = sessions.$
    $sessions.unshift(...session_hash_a1)
    sessions.set($sessions)
    return $sessions
  }
})
export interface sessions_T extends Writable$<HoloHash[]> {
  busy:Writable$<boolean>
  load():Promise<HoloHash>
  unshift(...session_hash_a1:HoloHash[]):HoloHash[]
}
