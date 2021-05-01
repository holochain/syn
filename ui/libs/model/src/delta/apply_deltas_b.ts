import { _b } from '@ctx-core/object'
import {
    Content, Delta, AddDelta, DeleteDelta, MetaDelta, TitleDelta, my_tag_b, rpc_hash_content_b
} from '@syn-ui/zome-client'
import { content_b } from '../content'
import { content_hash_b } from '../session'
import type { ApplyDelta } from './ApplyDelta'
import { deltas_b } from './deltas_b'
import { snapshot_content_b } from './snapshot_content_b'
import { committed_changes_b } from './committed_changes_b'
export const apply_deltas_b = _b('apply_deltas', (ctx)=>{
    const content = content_b(ctx)
    const my_tag = my_tag_b(ctx)
    const deltas = deltas_b(ctx)
    const snapshot_content = snapshot_content_b(ctx)
    const committed_changes = committed_changes_b(ctx)
    let current_$snapshot_content:undefined|Content
    snapshot_content.subscribe(async $snapshot_content=>{
        if (!$snapshot_content || current_$snapshot_content === $snapshot_content) return
        current_$snapshot_content = $snapshot_content
        const $my_tag = my_tag.$
        const $content:Content = {
            title: $snapshot_content.title,
            body: $snapshot_content.body,
            meta: {}
        }
        if ($my_tag) {
            $content.meta[$my_tag] = 0
        }
        content.$ = $content
        const new_$committed_changes:ApplyDelta[] = []
        new_$committed_changes.push(
            ...(await apply_deltas(deltas.$ || []))
        )
        committed_changes.update($committed_changes=>{
            $committed_changes.push(...new_$committed_changes)
            return $committed_changes
        })
    })
    return apply_deltas
    async function apply_deltas(deltas:Delta[]):Promise<ApplyDelta[]> {
        const $content = content.$
        const undoable_changes:ApplyDelta[] = []
        for (const delta of deltas) {
            switch (delta.type) {
                case 'Title': {
                    const deleted = $content.title
                    const Title_delta = delta as TitleDelta
                    $content.title = Title_delta.value
                    undoable_changes.push({ delta, deleted })
                    break
                }
                case 'Add': {
                    const Add_delta = delta as AddDelta
                    const [loc, text] = Add_delta.value
                    $content.body = $content.body.slice(0, loc) + text + $content.body.slice(loc)
                    undoable_changes.push({ delta })
                    break
                }
                case 'Delete': {
                    const Delete_delta = delta as DeleteDelta
                    const [start, end] = Delete_delta.value
                    const deleted = $content.body.slice(start, end)
                    $content.body = $content.body.slice(0, start) + $content.body.slice(end)
                    undoable_changes.push({ delta, deleted })
                    break
                }
                case 'Meta': {
                    const Meta_delta = delta as MetaDelta
                    const [tag, loc] = Meta_delta.value.setLoc
                    const deleted:[string, number] = [tag, $content.meta[tag]]
                    $content.meta[tag] = loc
                    undoable_changes.push({ delta, deleted })
                    break
                }
                default: {
                    throw `Unsupported delta.type ${delta.type}`
                }
            }
        }
        content.$ = $content
        const rpc_hash_content = rpc_hash_content_b(ctx)
        const content_hash = content_hash_b(ctx)
        content_hash.$ = await rpc_hash_content($content)
        return undoable_changes
    }
})
