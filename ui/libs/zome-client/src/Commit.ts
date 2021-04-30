import type { AgentPubKey } from '@holochain/conductor-api'
import type { EntryHash, HeaderHash } from '@syn-ui/utils/dist'
import type { Delta } from './Delta'
export interface Commit {
  snapshot:HeaderHash
  change:{
    deltas:string[]|Delta[]
    content_hash:EntryHash
    previous_change:EntryHash
    meta:{
      contributors:string[]
      witnesses:string[]
      app_specific:null
    }
  },
  participants:AgentPubKey[]
}
