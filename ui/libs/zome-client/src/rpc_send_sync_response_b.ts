import type { HoloHash } from '@holochain/conductor-api'
import { _b, assign } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
import type { StateForSync, StateForSync_serialized_I } from './StateForSync'
export const rpc_send_sync_response_b = _b('rpc_send_sync_response', (ctx)=>{
  const rpc = rpc_b(ctx)
  return function rpc_send_sync_response({ participant, state }:SendSyncResponseInput) {
    const serialized_state:StateForSync_serialized_I = assign({}, state, {
      deltas: state.deltas.map(delta=>JSON.stringify(delta))
    })
    return rpc('send_sync_response', {
      participant, state: serialized_state
    })
  }
})
export interface SendSyncResponseInput {
  participant:HoloHash
  state:StateForSync
}
