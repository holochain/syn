import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { apply_delta_fn_T } from './ApplyDelta'
export const apply_delta_fn_b = _b('apply_delta_fn', ()=>
  writable$<apply_delta_fn_T>(null)
)
