import { _b, B } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const committedChanges_b:committedChanges_b_T = _b('committedChanges', ()=>{
  return writable([]) as committedChanges_T
})
export type $committedChanges_T = ApplyDelta[]
export interface committedChanges_T extends Writable<$committedChanges_T> {}
export interface committedChanges_b_T extends B<committedChanges_T> {}
