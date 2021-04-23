import { _b, B } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const recordedChanges_b:recordedChanges_b_T = _b('recordedChanges', ()=>{
  return writable([]) as recordedChanges_T
})
export type $recordedChanges_T = ApplyDelta[]
export interface recordedChanges_T extends Writable<$recordedChanges_T> {}
export interface recordedChanges_b_T extends B<recordedChanges_T> {}
