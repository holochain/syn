import type { Delta } from '@syn-ui/zome-client'
import { _b } from '@ctx-core/object'
import { requested_changes_b } from './requested_changes_b'
import { recorded_changes_b } from './recorded_changes_b'
import { record_delta_b } from './record_delta_b'
export const record_deltas_b = _b('record_deltas', (ctx)=>{
  const requested_changes = requested_changes_b(ctx)
  return function record_deltas(_index:number, deltas:Delta[]) {
    const $requested_changes = requested_changes.$
    console.log('record_deltas REQUESTED', $requested_changes)
    for (const delta of deltas) {
      if ($requested_changes.length > 0) {
        // if this change is our next requested change then remove it
        if (JSON.stringify(delta) == JSON.stringify($requested_changes[0].delta)) {
          const recorded_changes = recorded_changes_b(ctx)
          recorded_changes.push($requested_changes.shift())
          requested_changes.set($requested_changes)
        } else {
          // TODO rebase?
          console.log('REBASE NEEDED?')
          console.log('requested ', $requested_changes[0].delta)
          console.log('to be recorded ', delta)
        }
      } else {
        // no requested changes so this must be from someone else so we don't have
        // to check our requested changes
        // TODO: do we need to check if this is a change that we did send and have already
        // integrated somehow and ignore if so.  (Seems unlikely?)
        const record_delta = record_delta_b(ctx)
        record_delta(delta)
      }
    }
  }
})
