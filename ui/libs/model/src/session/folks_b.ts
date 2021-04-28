import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { PubKeyToFolkRecord } from '@syn-ui/zome-client'
export const folks_b = _b('folks', ()=>{
  return writable$<$folks_T>({})
})
export type $folks_T = PubKeyToFolkRecord|null
