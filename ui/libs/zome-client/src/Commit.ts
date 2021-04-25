import type { HoloHash } from '@holochain/conductor-api'
export interface Commit {
  snapshot:HoloHash
  change:{
    deltas:string[]
    content_hash:HoloHash
    previous_change:HoloHash
    meta:{
      contributors:string[]
      witnesses:string[]
      app_specific:null
    }
  },
  participants:HoloHash[]
}
