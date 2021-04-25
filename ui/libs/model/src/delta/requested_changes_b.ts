import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const requested_changes_b = _b('requested_changes', ()=>{
  return writable$<ApplyDelta[]>([])
})
