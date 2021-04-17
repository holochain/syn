export interface Commit {
  snapshot:Buffer
  change:{
    deltas:string[]
    content_hash:Buffer
    previous_change:Buffer
    meta:{
      contributors:string[]
      witnesses:string[]
      app_specific:null
    }
  },
  participants:Buffer[]
}
