import { _b, B } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
import type { PubKeyToFolkRecord } from './Folk'
export const folks_b:folks_b_T = _b('folk', ()=>{
  return writable({})
})
export type $folks_T = PubKeyToFolkRecord
export interface folks_T extends Writable<$folks_T> {}
export interface folks_b_T extends B<folks_T> {}
