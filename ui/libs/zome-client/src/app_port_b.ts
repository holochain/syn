import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
export const app_port_b = _b('app_port', ()=>{
  return writable$<number|null>(null)
})
