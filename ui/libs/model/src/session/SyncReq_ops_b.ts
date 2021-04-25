import type { HoloHash } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import {
  agent_pub_key_b, FOLK_SEEN, me_b, rpc_send_folk_lore_b, rpc_send_sync_response_b, StateForSync
} from '@syn-ui/zome-client'
import { _scribe_signal_folk_pubKey_a1_b, recorded_changes_b } from '../delta'
import { update_folks_b } from './update_folks_b'
import { snapshot_hash_b } from './snapshot_hash_b'
import { content_hash_b } from './content_hash_b'
import { current_commit_header_hash_b } from './current_commit_header_hash_b'
import { folks_b } from './folks_b'
import { am_i_scribe_b } from './am_i_scribe_b'
import type { Ops } from './Ops'
export const SyncReq_ops_b = _b<Ops>('SyncReq_ops', (ctx)=>{
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
      if (am_i_scribe_b(ctx).$) {
        update_folks(participant, FOLK_SEEN)
        const state:StateForSync = {
          snapshot: snapshot_hash.$,
          commit_content_hash: content_hash.$,
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
        p[$me] = {
          pubKey: agent_pub_key_b(ctx).$
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
