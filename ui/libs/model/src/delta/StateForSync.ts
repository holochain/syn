import type { HoloHash } from '@holochain/conductor-api'
import type { DeltaValue } from '@syn/zome-client'
export interface StateForSync {
    snapshot:HoloHash,
    commit:HoloHash,
    commit_content_hash:HoloHash
    deltas:DeltaValue[],
}
export interface SerializedStateForSync {
    snapshot:HoloHash,
    commit:HoloHash,
    commit_content_hash:HoloHash
    deltas:string[],
}
