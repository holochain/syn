import type { AgentPubKey } from '@holochain/conductor-api'
import type { Content } from './Content'
import type { EntryHash } from '@syn-ui/utils'
export interface SessionInfo {
  session:EntryHash
  scribe:AgentPubKey
  snapshot_content:Content
  snapshot_hash:EntryHash
  deltas:string[]
  content_hash:EntryHash
}
