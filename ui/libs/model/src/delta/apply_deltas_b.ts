import { _b } from '@ctx-core/object'
import {
    Content, Delta, AddDelta, DeleteDelta, MetaDelta, TitleDelta, my_tag_b
} from '@syn-ui/zome-client'
import { content_b } from '../content'
import { session_info_b, session_info_deltas_b } from '../session'
import type { ApplyDelta } from './ApplyDelta'
import { committed_changes_b } from './committed_changes_b'
export const apply_deltas_b = _b('apply_deltas', (ctx)=>{
    const content = content_b(ctx)
    const my_tag = my_tag_b(ctx)
    const session_info = session_info_b(ctx)
    const session_info_deltas = session_info_deltas_b(ctx)
    const committed_changes = committed_changes_b(ctx)
    session_info.subscribe(async $session_info=>{
        if (!$session_info) return
        const { snapshot_content } = $session_info
        const $my_tag = my_tag.$
        const $content:Content = {
            title: snapshot_content.title,
            body: snapshot_content.body,
            meta: {}
        }
        if ($my_tag) {
            $content.meta[$my_tag] = 0
        }
        content.$ = $content
        committed_changes.$ = []
        await apply_deltas(session_info_deltas.$ || [])
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
        committed_changes.update($committed_changes=>{
            $committed_changes.push(...undoable_changes)
            return $committed_changes
        })
        return undoable_changes
    }
})
