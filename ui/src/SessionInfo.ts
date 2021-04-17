import type { Content } from './Content'
export interface SessionInfo {
  scribe:Buffer
  session:Buffer
  snapshot_content:Content
  snapshot_hash:Buffer
  deltas:string[]
  content_hash:Buffer
}
