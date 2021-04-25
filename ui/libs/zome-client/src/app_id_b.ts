import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
export const app_id_b = _b('app_id', ()=>{
  return writable$<string>(null)
})
