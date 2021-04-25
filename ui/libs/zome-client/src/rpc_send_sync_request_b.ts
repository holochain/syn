import { _b } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
import type { SessionInfo } from './SessionInfo'
export const rpc_send_sync_request_b = _b('rpc_send_sync_request', (ctx)=>{
  const rpc = rpc_b(ctx)
  return async function rpc_send_sync_request(session_info:SessionInfo) {
    return rpc('send_sync_request', session_info.scribe)
  }
})
