import type { HoloHash } from '@holochain/conductor-api'
import type { Content } from './Content'
export interface SessionInfo {
  scribe:HoloHash
  session:HoloHash
  snapshot_content:Content
  snapshot_hash:HoloHash
  deltas:string[]
  content_hash:HoloHash
}
