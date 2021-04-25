import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { Connection } from './Connection'
export const connection_b = _b('connection', ()=>{
  return writable$<Connection>(null)
})
