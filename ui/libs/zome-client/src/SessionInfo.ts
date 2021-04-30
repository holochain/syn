import type { AgentPubKey } from '@holochain/conductor-api'
import type { EntryHash } from '@syn-ui/utils'
import type { Content } from './Content'
export interface SessionInfo {
  type:'SessionInfo'
  session:EntryHash
  scribe:AgentPubKey
  snapshot_content:Content
  snapshot_hash:EntryHash
  deltas:string[]
  content_hash:EntryHash
}
