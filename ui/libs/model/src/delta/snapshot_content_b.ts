import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { Content, my_tag_b } from '@syn-ui/zome-client'
import { content_b } from '../content'
import { session_info_b } from '../session'
import { apply_delta_fn_b } from './apply_delta_fn_b'
import { deltas_b } from './deltas_b'
export const snapshot_content_b = _b('snapshot_content', (ctx)=>{
  const session_info = session_info_b(ctx)
  const my_tag = my_tag_b(ctx)
  const apply_delta_fn = apply_delta_fn_b(ctx)
  const deltas = deltas_b(ctx)
  const content = content_b(ctx)
  const snapshot_content = derived$(session_info, $session_info=>
    $session_info?.snapshot_content
  )
  snapshot_content.subscribe($snapshot_content=>{
    let $content:Content = {
      ...$snapshot_content,
      meta: {
        [my_tag.$]: 0
      }
    }
    const new_$committed_changes = []
    const $apply_delta_fn = apply_delta_fn.$
    for (const delta of deltas.$) {
      const [in_$content, change] = $apply_delta_fn($content, delta)
      $content = in_$content
      new_$committed_changes.push(change)
    }
    content.$ = $content
  })
  return snapshot_content
})
