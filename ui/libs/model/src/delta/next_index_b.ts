import { derived$ } from '@ctx-core/store'
import { _b } from '@ctx-core/object'
import { recorded_changes_b } from './recorded_changes_b'
export const next_index_b = _b('next_index', (ctx)=>{
    const recorded_changes = recorded_changes_b(ctx)
    return derived$(
        recorded_changes,
        $recorded_changes=>$recorded_changes.length
    )
})