import type { HoloHash } from '@holochain/conductor-api'
import type { Delta } from './Delta'
export interface StateForSync {
  snapshot:HoloHash
  commit?:HoloHash
  commit_content_hash:HoloHash
  deltas:Delta[]
}
export interface StateForSync_serialized_I {
  snapshot:HoloHash
  commit?:HoloHash
  commit_content_hash:HoloHash
  deltas:string[]
}
