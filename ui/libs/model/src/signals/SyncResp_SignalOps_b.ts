import type { HoloHash } from '@holochain/conductor-api'
import { _b, assign } from '@ctx-core/object'
import type { Delta } from '@syn-ui/zome-client'
import { bufferToBase64 } from '@syn-ui/utils'
import type { SerializedStateForSync, StateForSync } from '../delta'
import { record_delta_b } from '../delta'
import { content_hash_str_b } from '../session'
import type { SignalOps } from './SignalOps'
export const SyncResp_SignalOps_b = _b<SignalOps>('SyncResp_SignalOps', (ctx)=>{
  const content_hash_str = content_hash_str_b(ctx)
  const record_delta = record_delta_b(ctx)
  return {
    SyncResp: async (signal)=>{
      const serialized_state:SerializedStateForSync = signal.data.payload.signal_payload
      serialized_state.deltas = serialized_state.deltas.map(d=>JSON.parse(d))
      const state:SyncResp_stace_I = assign({} as StateForSync, serialized_state, {
        deltas: serialized_state.deltas.map(d=>JSON.parse(d))
      })
      // Make sure that we are working off the same snapshot and commit
      const commit_content_hash_str = bufferToBase64(state.commit_content_hash)
      if (commit_content_hash_str == content_hash_str.$) {
        for (const delta of state.deltas) {
          record_delta(delta)
        }
      } else {
        console.log('WHOA, sync response has different current state assumptions')
        // TODO: resync somehow
      }
    }
  }
})
export interface SyncResp_stace_I extends Omit<StateForSync, 'deltas'> {
  snapshot:HoloHash,
  commit:HoloHash,
  commit_content_hash:HoloHash
  deltas:Delta[]
}
