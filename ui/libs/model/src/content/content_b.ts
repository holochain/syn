import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
import type { Content } from '@syn-ui/zome-client'
export const content_b = _b('content', ()=>{
    const content = writable$<Content>(_$content())
    return content
})
export function _$content() {
  return { title: '', body: '', meta: {} }
}
