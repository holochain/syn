import type { HoloHash } from '@holochain/conductor-api'
import type { DeltaValue } from './delta'
export interface StateForSync {
    snapshot: HoloHash,
    commit: HoloHash,
    deltas: DeltaValue[],
}
