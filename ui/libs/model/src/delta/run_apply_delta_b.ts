import type { Delta } from '@syn-ui/zome-client'
import { _b } from '@ctx-core/object'
import { content_b } from '../content'
import { apply_delta_fn_b } from './apply_delta_fn_b'
import type { ApplyDelta } from './ApplyDelta'
export const run_apply_delta_b = _b('run_apply_delta', (ctx)=>{
  const content = content_b(ctx)
  const apply_delta_fn = apply_delta_fn_b(ctx)
  return function run_apply_delta(delta:Delta):ApplyDelta {
    const [$content, undoable_change] = apply_delta_fn.$(content.$, delta)
    content.set($content)
    return undoable_change
  }
})
