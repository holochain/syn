import type { Delta } from './Delta'
import type { Content } from '../content'
export interface ApplyDelta {
  delta:Delta
  deleted?:applyDelta_ret_deleted_T
  id?:string
  at?:number
}
export type applyDelta_ret_deleted_T = string|[string, number]
export type applyDelta_ret_T = [Content, ApplyDelta]
export type applyDelta_T = (content:Content, delta:Delta)=>applyDelta_ret_T
