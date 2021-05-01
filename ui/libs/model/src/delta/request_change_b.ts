import { _b } from '@ctx-core/object'
import { Delta, my_tag_b, rpc_send_change_request_b } from '@syn-ui/zome-client'
import { console_b } from '@syn-ui/utils'
import { am_i_scribe_b, scribe_b } from '../session'
import { next_index_b } from './next_index_b'
import { send_change_b } from './send_change_b'
import { requested_changes_b } from './requested_changes_b'
import { apply_deltas_b } from './apply_deltas_b'
import { record_deltas_b } from './record_deltas_b'
export const request_change_b = _b('request_change', (ctx)=>{
    const console = console_b(ctx)
    const record_deltas = record_deltas_b(ctx)
    const request_changes = requested_changes_b(ctx)
    let request_counter = 0
    return async function request_change(deltas:Delta[]) {
        // any requested made by the scribe should be recorded immediately
        const am_i_scribe = am_i_scribe_b(ctx)
        const next_index = next_index_b(ctx)
        if (am_i_scribe.$ === true) {
            const $next_index = next_index.$
            await record_deltas(deltas)
            const send_change = send_change_b(ctx)
            await send_change({ index: $next_index, deltas })
        } else {
            // otherwise apply the change and queue it to requested changes for
            // confirmation later and send request change to scribe
            // create a unique id for each change
            // TODO: this should be part of actual changeReqs
            const my_tag = my_tag_b(ctx)
            const change_id = my_tag.$ + '.' + request_counter
            const change_at = Date.now()
            const $requested_changes = request_changes.$
            // we want to apply this to current next_index plus any previously
            // requested changes that haven't yet be recorded
            const index = next_index.$ + $requested_changes.length
            const apply_deltas = apply_deltas_b(ctx)
            const undoable_changes = await apply_deltas(deltas)
            for (const undoable_change of undoable_changes) {
                undoable_change.id = change_id
                undoable_change.at = change_at
            }
            $requested_changes.push(...undoable_changes)
            request_changes.$ = $requested_changes
            console.log('REQUESTED', $requested_changes)
            const rpc_send_change_request = rpc_send_change_request_b(ctx)
            const scribe = scribe_b(ctx)
            await rpc_send_change_request({
                index, deltas, scribe: scribe.$
            })
            request_counter += 1
        }
    }
})
