import { _b } from '@ctx-core/object'
import { Writable$, writable$ } from '@ctx-core/store'
import type { ApplyDelta } from './ApplyDelta'
export const recorded_changes_b = _b('recorded_changes', ()=>
  new recorded_changes_T()
)
export type $recorded_changes_T = ApplyDelta[]
export class recorded_changes_T implements Writable$<$recorded_changes_T> {
  #store = writable$<$recorded_changes_T>([])
  set = this.#store.set
  subscribe = this.#store.subscribe
  update = this.#store.update
  $ = this.#store.$
  push = (...apply_delta_a1:ApplyDelta[])=>{
    const $store = this.#store.$
    $store.push(...apply_delta_a1)
    this.#store.set($store)
    return $store
  }
}
