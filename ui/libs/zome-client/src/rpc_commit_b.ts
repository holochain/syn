import type { HoloHash } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
import type { Commit } from './Commit'
export const rpc_commit_b = _b('rpc_commit', (ctx)=>{
  const rpc = rpc_b(ctx)
  return async function rpc_commit(commit:Commit):Promise<HoloHash> {
    return rpc('commit', commit)
  }
})
