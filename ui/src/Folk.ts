import type { HoloHash } from '@holochain/conductor-api'
import type { FolkColors } from './colors'
export interface Folk {
  pubKey:HoloHash
  inSession?:boolean
  colors?:FolkColors
  lastSeen?:number
}
export type PubKeyToFolkRecord = Record<string, Folk>
export enum FolkStatus {
  FOLK_SEEN = 1,
  FOLK_GONE = 2,
  FOLK_UNKNOWN = 3,
}
export const FOLK_SEEN = FolkStatus.FOLK_SEEN
export const FOLK_GONE = FolkStatus.FOLK_GONE
export const FOLK_UNKNOWN = FolkStatus.FOLK_UNKNOWN
