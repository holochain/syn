import type { HoloHash } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
export const rpc_get_sessions_b = _b('rpc_get_sessions', (ctx)=>{
  const rpc = rpc_b(ctx)
  return async function rpc_get_sessions():Promise<HoloHash[]> {
    return await rpc('get_sessions')
  }
})
