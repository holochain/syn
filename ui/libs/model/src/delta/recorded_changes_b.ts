import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const recorded_changes_b = _b('recorded_changes', ()=>
    writable$<$recorded_changes_T>([])
)
export type $recorded_changes_T = ApplyDelta[]
