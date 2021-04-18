import type { HoloHash } from '@holochain/conductor-api'
import type { DeltaValue } from './Delta'
export interface StateForSync {
    snapshot: HoloHash,
    commit: HoloHash,
    deltas: DeltaValue[],
}
