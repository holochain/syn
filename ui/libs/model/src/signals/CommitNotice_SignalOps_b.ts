import { _b } from '@ctx-core/object'
import { bufferToBase64, EntryHash, HeaderHash } from '@syn-ui/utils'
import { committed_changes_b, next_index_b, recorded_changes_b } from '../delta'
import { content_hash_b, content_hash_str_b } from '../session'
import type { SignalOps } from './SignalOps'
export const CommitNotice_SignalOps_b = _b<SignalOps>('CommitNotice_SignalOps', (ctx)=>{
  const content_hash = content_hash_b(ctx)
  const content_hash_str = content_hash_str_b(ctx)
  const next_index = next_index_b(ctx)
  const committed_changes = committed_changes_b(ctx)
  const recorded_changes = recorded_changes_b(ctx)
  return {
    CommitNotice: async (signal)=>{
      const commit_info:CommitInfo = signal.data.payload.signal_payload
      // make sure we are at the right place to be able to just move forward with the commit
      const $content_hash_str = content_hash_str.$
      if ($content_hash_str == bufferToBase64(commit_info.previous_content_hash) &&
        next_index.$ === commit_info.deltas_committed) {
        content_hash.$ = commit_info.commit_content_hash
        committed_changes.update($committed_changes=>{
          $committed_changes.push(...recorded_changes.$)
          return $committed_changes
        })
        recorded_changes.$ = []
      } else {
        console.log('received commit notice for beyond our last commit, gotta resync')
        console.log('commit.commit_content_hash:', bufferToBase64(commit_info.commit_content_hash))
        console.log('commit.previous_content_hash:', bufferToBase64(commit_info.previous_content_hash))
        console.log('commit.deltas_committed:', commit_info.deltas_committed)
        console.log('my $session.contentHashStr', $content_hash_str)
        console.log('my next_index', next_index.$)
        // TODO resync
      }
    }
  }
})
export interface CommitInfo {
  deltas_committed:number
  commit_content_hash:EntryHash
  previous_content_hash:EntryHash
  commit:HeaderHash
}
