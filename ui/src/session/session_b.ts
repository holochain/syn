import { _b, B } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
import type { Session } from './Session'
export const session_b:session_b_T = _b('session', ()=>{
  const session = writable(null)
  return session as session_T
})
export type $session_T = Session
export class session_T implements Writable<$session_T> {
  store = writable(null)
  set = this.store.set
  subscribe = this.store.subscribe
  update = this.store.update
}
export interface session_b_T extends B<session_T> {}
