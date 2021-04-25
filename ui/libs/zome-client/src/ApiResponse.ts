import type { HoloHash } from '@holochain/conductor-api'
import type { Participant } from './Participant'
export interface ApiResponse extends Record<string, any> {
  pubKey:HoloHash
  gone?:boolean
  participants:Participant[]
}
