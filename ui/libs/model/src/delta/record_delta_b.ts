import type { Delta } from '@syn-ui/zome-client'
import { _b } from '@ctx-core/object'
import { run_apply_delta_b } from './run_apply_delta_b'
import { recorded_changes_b } from './recorded_changes_b'
export const record_delta_b = _b('record_delta', (ctx)=>{
  const run_apply_delta = run_apply_delta_b(ctx)
  const recorded_changes = recorded_changes_b(ctx)
  return function record_delta(delta:Delta) {
    // apply the deltas to the content which returns the undoable change
    const undoable_change = run_apply_delta(delta)
    // append changes to the recorded history
    recorded_changes.push(undoable_change)
  }
})
