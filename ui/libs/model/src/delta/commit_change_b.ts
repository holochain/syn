import { _b } from '@ctx-core/object'
import { Commit, rpc_commit_b, rpc_hash_content_b } from '@syn/zome-client'
import { bufferToBase64, console_b } from '@syn/utils'
import { content_b } from '../content'
import {
    am_i_scribe_b, commit_in_progress_b, content_hash_b, content_hash_str_b,
    current_commit_header_hash_b, session_info_snapshot_hash_b, session_info_snapshot_hash_str_b
} from '../session'
import { recorded_changes_b } from './recorded_changes_b'
import { _scribe_signal_folk_pubKey_a1_b } from './_scribe_signal_folk_pubKey_a1_b'
import { committed_changes_b } from './committed_changes_b'
export const commit_change_b = _b('commit_change', (ctx)=>{
    const console = console_b(ctx)
    const recorded_changes = recorded_changes_b(ctx)
    const commit_in_progress = commit_in_progress_b(ctx)
    const rpc_hash_content = rpc_hash_content_b(ctx)
    const content = content_b(ctx)
    const session_info_snapshot_hash_str = session_info_snapshot_hash_str_b(ctx)
    const content_hash = content_hash_b(ctx)
    const content_hash_str = content_hash_str_b(ctx)
    const session_info_snapshot_hash = session_info_snapshot_hash_b(ctx)
    const _scribe_signal_folk_pubKey_a1 = _scribe_signal_folk_pubKey_a1_b(ctx)
    const rpc_commit = rpc_commit_b(ctx)
    const current_commit_header_hash = current_commit_header_hash_b(ctx)
    const committed_changes = committed_changes_b(ctx)
    const am_i_scribe = am_i_scribe_b(ctx)
    return async function commit_change() {
        if (am_i_scribe.$ === true) {
            await try_commit()
        } else {
            alert(`You ain't the scribe!`)
        }
    }
    async function try_commit() {
        if (recorded_changes.$.length == 0) {
            const msg = 'No changes to commit!'
            if (typeof window === 'undefined') {
                console.info(msg)
            } else {
                window.alert(msg)
            }
            return
        }
        commit_in_progress.$ = true
        try {
            const new_content_hash = await rpc_hash_content(content.$)
            console.log('committing from snapshot', session_info_snapshot_hash_str.$)
            console.log('  prev_hash:', content_hash_str.$)
            console.log('   new_hash:', bufferToBase64(new_content_hash))
            const commit:Commit = {
                snapshot: session_info_snapshot_hash.$!,
                change: {
                    deltas: recorded_changes.$.map(c=>JSON.stringify(c.delta)),
                    content_hash: new_content_hash,
                    previous_change: content_hash.$!,
                    meta: {
                        contributors: [],
                        witnesses: [],
                        app_specific: null
                    }
                },
                participants: _scribe_signal_folk_pubKey_a1()
            }
            try {
                current_commit_header_hash.$ = await rpc_commit(commit)
                // if commit successful we need to update the content hash and its string in the session
                content_hash.$ = new_content_hash
                committed_changes.update($committed_changes=>{
                    $committed_changes.push(...recorded_changes.$)
                    return $committed_changes
                })
                recorded_changes.$ = []
            } catch (e) {
                console.trace('Error:', e)
                throw e
            }
        } finally {
            commit_in_progress.$ = false
        }
    }
})
