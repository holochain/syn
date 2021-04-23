import { _b, B } from '@ctx-core/object'
import { writable, Writable } from '@ctx-core/store'
export const content_b:content_b_T = _b('content', ()=>{
  return writable({ title: '', body: '' }) as content_T
})
export interface $content_T {
  title:string
  body:string
  meta?:Record<string, number>
}
export interface content_T extends Writable<$content_T> {}
export interface content_b_T extends B<content_T> {}
