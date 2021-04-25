import { _b } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const committed_changes_b = _b('committed_changes', ()=>{
  return writable<ApplyDelta[]>([]) as committed_changes_T
})
export type $committed_changes_T = ApplyDelta[]
export interface committed_changes_T extends Writable<$committed_changes_T> {
  push(...changes:ApplyDelta[]):void
}
