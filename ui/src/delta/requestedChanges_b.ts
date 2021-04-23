import { _b } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const requestedChanges_b = _b('requestedChanges', () => {
  return writable([]) as requestedChanges_T
})
export const requestedChanges:requestedChanges_T = writable([])
export type $requestedChanges_T = ApplyDelta[]
export interface requestedChanges_T extends Writable<$requestedChanges_T> {}
