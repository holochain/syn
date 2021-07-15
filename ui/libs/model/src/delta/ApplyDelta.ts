import type { Content, Delta } from '@syn/zome-client'
export interface ApplyDelta {
    delta:Delta
    deleted?:ApplyDelta_deleted_T
    id?:string
    at?:number
}
export type ApplyDelta_deleted_T = string|[string, number]
export type apply_delta_ret_T = [Content, ApplyDelta]
export type apply_delta_fn_T = (content:Content, delta:Delta)=>apply_delta_ret_T
