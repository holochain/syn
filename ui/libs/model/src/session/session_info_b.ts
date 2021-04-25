import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { SessionInfo } from '@syn-ui/zome-client'
export const session_info_b = _b('session_info', ()=>
  writable$<SessionInfo>(null)
)
