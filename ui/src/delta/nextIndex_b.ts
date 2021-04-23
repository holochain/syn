import { derived } from '@ctx-core/store'
import { _b } from '@ctx-core/object'
import { recordedChanges_b } from './recordedChanges_b'
export const nextIndex_b = _b('nextIndex', (ctx)=>{
  const recordedChanges = recordedChanges_b(ctx)
  return derived(
    recordedChanges,
    c=>c.length
  )
})
