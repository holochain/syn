import { _b } from '@ctx-core/object'
import {
  Content, Delta, AddDelta, DeleteDelta, MetaDelta, TitleDelta, my_tag_b
} from '@syn-ui/zome-client'
import { content_b } from '../content'
import type { ApplyDelta } from './ApplyDelta'
import { deltas_b } from './deltas_b'
import { snapshot_content_b } from './snapshot_content_b'
import { committed_changes_b } from './committed_changes_b'
export const run_apply_delta_b = _b('run_apply_delta', (ctx)=>{
  const content = content_b(ctx)
  const my_tag = my_tag_b(ctx)
  const deltas = deltas_b(ctx)
  const snapshot_content = snapshot_content_b(ctx)
  const committed_changes = committed_changes_b(ctx)
  snapshot_content.subscribe($snapshot_content=>{
    if (!$snapshot_content) return
    const $content:Content = {
      title: $snapshot_content.title,
      body: $snapshot_content.body,
      meta: {
        [my_tag.$]: 0
      }
    }
    content.$ = $content
    const new_$committed_changes:ApplyDelta[] = []
    for (const delta of deltas.$ || []) {
      const change = run_apply_delta(delta)
      new_$committed_changes.push(change)
    }
    committed_changes.update($committed_changes => {
      $committed_changes.push(...new_$committed_changes)
      return $committed_changes
    })
  })
  return run_apply_delta
  function run_apply_delta(delta:Delta):ApplyDelta {
    const $content = content.$
    let undoable_change:ApplyDelta
    switch (delta.type) {
      case 'Title': {
        const deleted = $content.title
        const Title_delta = delta as TitleDelta
        $content.title = Title_delta.value
        undoable_change = { delta, deleted }
        break
      }
      case 'Add': {
        const Add_delta = delta as AddDelta
        const [loc, text] = Add_delta.value
        $content.body = $content.body.slice(0, loc) + text + $content.body.slice(loc)
        undoable_change = { delta }
        break
      }
      case 'Delete': {
        const Delete_delta = delta as DeleteDelta
        const [start, end] = Delete_delta.value
        const deleted = $content.body.slice(start, end)
        $content.body = $content.body.slice(0, start) + $content.body.slice(end)
        undoable_change = { delta, deleted }
        break
      }
      case 'Meta': {
        const Meta_delta = delta as MetaDelta
        const [tag, loc] = Meta_delta.value.setLoc
        const deleted:[string, number] = [tag, $content.meta[tag]]
        $content.meta[tag] = loc
        undoable_change = { delta, deleted }
        break
      }
      default: {
        throw `Unsupported delta.type ${delta.type}`
      }
    }
    content.set($content)
    return undoable_change
  }
})
