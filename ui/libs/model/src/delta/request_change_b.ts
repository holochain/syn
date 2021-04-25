import { _b } from '@ctx-core/object'
import { Delta, my_tag_b, rpc_send_change_request_b } from '@syn-ui/zome-client'
import { am_i_scribe_b } from '../session/am_i_scribe_b'
import { scribe_b } from '../session'
import { next_index_b } from './next_index_b'
import { record_delta_b } from './record_delta_b'
import { send_change_b } from './send_change_b'
import { requested_changes_b } from './requested_changes_b'
import { run_apply_delta_b } from './run_apply_delta_b'
export const request_change_b = _b('request_change', (ctx)=>{
  const record_delta = record_delta_b(ctx)
  const request_changes = requested_changes_b(ctx)
  let request_counter = 0
  return async function request_change(deltas:Delta[]) {
    // any requested made by the scribe should be recorded immediately
    if (am_i_scribe_b(ctx).$ === true) {
      const $next_index = next_index_b(ctx).$
      for (const delta of deltas) {
        record_delta(delta)
      }
      await send_change_b(ctx)({ index: $next_index, deltas })
    } else {
      // otherwise apply the change and queue it to requested changes for
      // confirmation later and send request change to scribe

      // create a unique id for each change
      // TODO: this should be part of actual changeReqs
      const change_id = my_tag_b(ctx).$ + '.' + request_counter
      const change_at = Date.now()

      const $requested_changes = request_changes.$
      // we want to apply this to current next_index plus any previously
      // requested changes that haven't yet be recorded
      const index = next_index_b(ctx).$ + $requested_changes.length
      for (const delta of deltas) {
        const undoable_change = run_apply_delta_b(ctx)(delta)
        undoable_change.id = change_id
        undoable_change.at = change_at
        // append changes to the requested queue
        // request_changes.push
        $requested_changes.push(undoable_change)
      }
      request_changes.$ = $requested_changes
      console.log('REQUESTED', $requested_changes)
      await rpc_send_change_request_b(ctx)({
        index, deltas, scribe: scribe_b(ctx).$
      })
      request_counter += 1
    }
  }
})
