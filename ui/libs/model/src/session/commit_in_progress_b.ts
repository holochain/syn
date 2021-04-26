import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
export const commit_in_progress_b = _b('commit_in_progress', ()=>
  writable$<boolean>(false)
)
