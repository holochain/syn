import type { AgentPubKey } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { derived$, Readable$ } from '@ctx-core/store'
import { session_info_b } from './session_info_b'
export const scribe_b = _b('scribe', (ctx)=>{
  const session_info = session_info_b(ctx)
  return derived$(session_info, $session_info=>
    $session_info?.scribe
  ) as Readable$<AgentPubKey>
})
