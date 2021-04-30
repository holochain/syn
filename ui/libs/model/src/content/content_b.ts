import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { Content } from '@syn-ui/zome-client'
export const content_b = _b('content', ()=>{
  const content = writable$<Content>({ title: '', body: '', meta: {} })
  return content
})
