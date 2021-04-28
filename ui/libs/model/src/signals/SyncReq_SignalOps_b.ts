import type { HoloHash } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import {
  agent_pub_key_b, FOLK_SEEN, me_b, rpc_send_folk_lore_b, rpc_send_sync_response_b, StateForSync
} from '@syn-ui/zome-client'
import type { EntryHash } from '@syn-ui/utils'
import { _scribe_signal_folk_pubKey_a1_b, recorded_changes_b } from '../delta'
import {
  am_i_scribe_b, content_hash_b, current_commit_header_hash_b, folks_b,
  snapshot_hash_b, update_folks_b
} from '../session'
import type { SignalOps } from './SignalOps'
export const SyncReq_SignalOps_b = _b<SignalOps>('SyncReq_SignalOps', (ctx)=>{
  const me = me_b(ctx)
  const folks = folks_b(ctx)
  const update_folks = update_folks_b(ctx)
  const rpc_send_sync_response = rpc_send_sync_response_b(ctx)
  const recorded_changes = recorded_changes_b(ctx)
  const content_hash = content_hash_b(ctx)
  const snapshot_hash = snapshot_hash_b(ctx)
  const current_commit_header_hash = current_commit_header_hash_b(ctx)
  const _scribe_signal_folk_pubKey_a1 = _scribe_signal_folk_pubKey_a1_b(ctx)
  const rpc_send_folk_lore = rpc_send_folk_lore_b(ctx)
  return {
    SyncReq: async (signal)=>{
      const participant:HoloHash = signal.data.payload.signal_payload
      const $me = me.$
      const am_i_scribe = am_i_scribe_b(ctx)
      if (am_i_scribe.$ === true) {
        update_folks(participant, FOLK_SEEN)
        const state:StateForSync = {
          snapshot: snapshot_hash.$ as EntryHash,
          commit_content_hash: content_hash.$ as EntryHash,
          deltas: recorded_changes.$.map(c=>c.delta)
        }
        const $current_commit_header_hash = current_commit_header_hash.$
        if ($current_commit_header_hash) {
          state['commit'] = $current_commit_header_hash
        }
        // send a sync response to the sender
        await rpc_send_sync_response({ participant, state })
        // and send everybody a folk lore p2p message with new participants
        const $folks = folks.$
        let p = { ...$folks }
        const agent_pub_key = agent_pub_key_b(ctx)
        p[$me] = {
          pubKey: agent_pub_key.$
        }
        const data = { participants: p }
        await rpc_send_folk_lore({
          participants: _scribe_signal_folk_pubKey_a1(),
          data,
        })
      } else {
        console.log('syncReq received but I\'m not the scribe!')
      }
    }
  }
})
