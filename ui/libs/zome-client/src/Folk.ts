import type { HoloHash } from '@holochain/conductor-api'
import type { FolkColors } from './FolkColors'
export interface Folk {
  pubKey:HoloHash
  inSession?:boolean
  colors?:FolkColors
  lastSeen?:number
}
export type string_Folk_Record = Record<string, Folk>
export type pk = 'pubKey'
export type PubKeyToFolkRecord = {
  [L in keyof Exclude<any, 'pubKey'>]: Folk;
} & {
  pubKey?: HoloHash
}
export enum FolkStatus {
  FOLK_SEEN = 1,
  FOLK_GONE = 2,
  FOLK_UNKNOWN = 3,
}
export const FOLK_SEEN = FolkStatus.FOLK_SEEN
export const FOLK_GONE = FolkStatus.FOLK_GONE
export const FOLK_UNKNOWN = FolkStatus.FOLK_UNKNOWN
