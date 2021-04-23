import { _b, B } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
export const scribeStr_b:scribeStr_b_T = _b('scribeStr', ()=>{
  return writable('')
})
export type $scribeStr_T = string
export interface scribeStr_T extends Writable<$scribeStr_T> {}
export interface scribeStr_b_T extends B<scribeStr_T> {}
