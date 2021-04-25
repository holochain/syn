import type { HoloHash } from '@holochain/conductor-api'
export interface Participant extends HoloHash {
  pubKey:HoloHash
  meta:number
}
