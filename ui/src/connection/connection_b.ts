import { _b, B } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
import type { Connection } from './Connection'
export const connection_b:connection_b_T = _b('connection', ()=>{
  return writable(null)
})
export type $connection = Connection
export interface connection_T extends Writable<$connection> {}
export interface connection_b_T extends B<connection_T> {}
