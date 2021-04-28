import type { EntryHash, HeaderHash } from '@syn-ui/utils'
import type { Delta } from './Delta'
export interface StateForSync {
  snapshot:EntryHash
  commit?:HeaderHash
  commit_content_hash:EntryHash
  deltas:Delta[]
}
export interface StateForSync_serialized_I {
  snapshot:EntryHash
  commit?:HeaderHash
  commit_content_hash:EntryHash
  deltas:string[]
}
