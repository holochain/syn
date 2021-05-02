import { _b } from '@ctx-core/object'
import { rpc_send_sync_request_b } from '@syn-ui/zome-client'
import { console_b } from '@syn-ui/utils'
import { requested_changes_b } from '../delta'
import { session_info_b } from '../session'
import { Timer } from './Timer'
const request_timeout = 1000
export const request_checker_timer_b = _b('request_checker_timer', (ctx)=>{
    const console = console_b(ctx)
    const requested_changes = requested_changes_b(ctx)
    const session_info = session_info_b(ctx)
    const rpc_send_sync_request = rpc_send_sync_request_b(ctx)
    return new Timer(async ()=>{
        const $requested_changes = requested_changes.$
        if ($requested_changes.length > 0) {
            const at = $requested_changes[0]?.at
            if (at && (Date.now() - at) > request_timeout) {
                // for now let's just do the most drastic thing!
                /*
                  console.log('requested change timed out! Undoing all changes', $requested_changes[0])
                  // TODO: make sure this is transactional and no request_changes squeak in !
                  while ($requested_changes.length > 0) {
                  requested_changes.update(changes => {
                  const change = changes.pop()
                  console.log('undoing ', change)
                  const undoDelta = undoFn(change)
                  console.log('undoDelta: ', undoDelta)
                  const apply_deltas = apply_deltas_b(ctx)
                  await apply_deltas(undoDelta)
                  return changes
                  })
                  }*/

                // and send a sync request incase something just got out of sequence
                // TODO: prepare for shifting to new scribe if they went offline
                console.log('HERE')
                const $session_info = session_info.$
                if ($session_info) {
                    await rpc_send_sync_request($session_info.scribe)
                }
            }
        }
    }, request_timeout / 2)
})
