import { _b, B } from '@ctx-core/object'
import { writable$, Writable } from '@ctx-core/store'
export const app_port_b:app_port_b_T = _b('app_port', ()=>{
  return writable$(null)
})
export type $app_port_T = number
export interface app_port_T extends Writable<$app_port_T> {}
export interface app_port_b_T extends B<app_port_T> {}
