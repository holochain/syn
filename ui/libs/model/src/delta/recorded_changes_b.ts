import { _b } from '@ctx-core/object'
import { writable$, writable$_C } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const recorded_changes_b = _b('recorded_changes', ()=>
  new recorded_changes_T(writable$<$recorded_changes_T>([]))
)
export type $recorded_changes_T = ApplyDelta[]
export class recorded_changes_T extends writable$_C<$recorded_changes_T> {
  push = (...apply_delta_a1:ApplyDelta[])=>{
    const $store = this.$
    $store.push(...apply_delta_a1)
    this.$ = $store
    return $store
  }
}
