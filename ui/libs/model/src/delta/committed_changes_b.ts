import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const committed_changes_b = _b('committed_changes', ()=>{
    return writable$<ApplyDelta[]>([])
})
