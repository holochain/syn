import type { HoloHash } from '@holochain/conductor-api'
import { _b, assign } from '@ctx-core/object'
import type { Delta } from '@syn-ui/zome-client'
import { bufferToBase64, console_b } from '@syn-ui/utils'
import type { SerializedStateForSync, StateForSync } from '../delta'
import { record_deltas_b } from '../delta'
import { content_hash_str_b } from '../session'
import type { SignalOps } from './SignalOps'
export const SyncResp_SignalOps_b = _b<SignalOps>('SyncResp_SignalOps', (ctx)=>{
    const console = console_b(ctx)
    const content_hash_str = content_hash_str_b(ctx)
    return {
        SyncResp: async (signal)=>{
            const serialized_state:SerializedStateForSync = signal.data.payload.signal_payload
            const state:SyncResp_state_I = assign({} as StateForSync, serialized_state, {
                deltas: serialized_state.deltas.map(d=>JSON.parse(d))
            })
            // Make sure that we are working off the same snapshot and commit
            const commit_content_hash_str = bufferToBase64(state.commit_content_hash)
            if (commit_content_hash_str == content_hash_str.$) {
                const record_deltas = record_deltas_b(ctx)
                await record_deltas(state.deltas)
            } else {
                console.log('WHOA, sync response has different current state assumptions')
                // TODO: resync somehow
            }
        }
    }
})
export interface SyncResp_state_I extends Omit<StateForSync, 'deltas'> {
    snapshot:HoloHash,
    commit:HoloHash,
    commit_content_hash:HoloHash
    deltas:Delta[]
}
