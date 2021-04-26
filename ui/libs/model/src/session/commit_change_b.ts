import { _b, assign } from '@ctx-core/object'
import { Commit, rpc_commit_b, rpc_hash_content_b } from '@syn-ui/zome-client'
import { bufferToBase64 } from '@syn-ui/utils'
import { _scribe_signal_folk_pubKey_a1_b, committed_changes_b, recorded_changes_b } from '../delta'
import { content_b } from '../content'
import { commit_in_progress_b } from './commit_in_progress_b'
import { snapshot_hash_str_b } from './snapshot_hash_str_b'
import { content_hash_str_b } from './content_hash_str_b'
import { content_hash_b } from './content_hash_b'
import { snapshot_hash_b } from './snapshot_hash_b'
import { current_commit_header_hash_b } from './current_commit_header_hash_b'
import { session_info_b } from './session_info_b'
import { am_i_scribe_b } from './am_i_scribe_b'
export const commit_change_b = _b('commit_change', (ctx)=>{
  const recorded_changes = recorded_changes_b(ctx)
  const commit_in_progress = commit_in_progress_b(ctx)
  const rpc_hash_content = rpc_hash_content_b(ctx)
  const content = content_b(ctx)
  const snapshot_hash_str = snapshot_hash_str_b(ctx)
  const content_hash = content_hash_b(ctx)
  const content_hash_str = content_hash_str_b(ctx)
  const snapshot_hash = snapshot_hash_b(ctx)
  const _scribe_signal_folk_pubKey_a1 = _scribe_signal_folk_pubKey_a1_b(ctx)
  const rpc_commit = rpc_commit_b(ctx)
  const current_commit_header_hash = current_commit_header_hash_b(ctx)
  const committed_changes = committed_changes_b(ctx)
  const session_info = session_info_b(ctx)
  return async function commit_change() {
    const am_i_scribe = am_i_scribe_b(ctx)
    if (am_i_scribe.$ === true) {
      const $recorded_changes = recorded_changes.$
      if ($recorded_changes.length == 0) {
        alert('No changes to commit!')
        return
      }
      commit_in_progress.set(true)
      try {
        const new_content_hash = await rpc_hash_content(content.$)
        console.log('committing from snapshot', snapshot_hash_str.$)
        console.log('  prev_hash:', content_hash_str.$)
        console.log('   new_hash:', bufferToBase64(new_content_hash))
        const commit:Commit = {
          snapshot: snapshot_hash.$,
          change: {
            deltas: $recorded_changes.map(c=>JSON.stringify(c.delta)),
            content_hash: new_content_hash,
            previous_change: content_hash.$,
            meta: {
              contributors: [],
              witnesses: [],
              app_specific: null
            }
          },
          participants: _scribe_signal_folk_pubKey_a1()
        }
        try {
          const $current_commit_header_hash = await rpc_commit(commit)
          current_commit_header_hash.set($current_commit_header_hash)
          // if commit successfull we need to update the content hash and its string in the session
          session_info.update($session_info=>
            assign($session_info, {
              content_hash: new_content_hash
            })
          )
          committed_changes.update($committed_changes=>{
            $committed_changes.push(...$recorded_changes)
            return $committed_changes
          })
          recorded_changes.set([])
        } catch (e) {
          console.log('Error:', e)
        }
      } finally {
        commit_in_progress.set(false)
      }
    } else {
      alert(`You ain't the scribe!`)
    }
  }
})
