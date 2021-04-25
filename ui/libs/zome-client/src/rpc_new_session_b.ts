import { _b } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
import type { Content } from './Content'
import type { SessionInfo } from './SessionInfo'
export const rpc_new_session_b = _b('rpc_new_session', (ctx) => {
  const rpc = rpc_b(ctx)
  return async function rpc_new_session(
    content:Content = { title: '', body: '' }
  ):Promise<SessionInfo> {
    return rpc('new_session', { content })
  }
})
