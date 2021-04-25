import { _b } from '@ctx-core/object'
import { bufferToBase64, EntryHash, HeaderHash } from '@syn-ui/utils'
import type { Ops } from './Ops'
import { content_hash_str_b } from './content_hash_str_b'
import { next_index_b } from '../delta'
export const CommitNotice_ops_b = _b<Ops>('CommitNotice_ops', (ctx)=>{
  const content_hash_str = content_hash_str_b(ctx)
  const next_index = next_index_b(ctx)
  return {
    CommitNotice: async (signal)=>{
      const commitInfo:CommitInfo = signal.data.payload.signal_payload
      // make sure we are at the right place to be able to just move forward with the commit
      const $content_hash_str = content_hash_str.$
      if ($content_hash_str == bufferToBase64(commitInfo.previous_content_hash) &&
        next_index.$ === commitInfo.deltas_committed) {
        content_hash_str.$ = bufferToBase64(commitInfo.commit_content_hash)
        this.committed = this.committed.concat(this.recorded)
        this.recorded = []
        this.committed_changes.set(this.committed)
        this.recorded_changes.set(this.recorded)
      } else {
        console.log('received commit notice for beyond our last commit, gotta resync')
        console.log('commit.commit_content_hash:', bufferToBase64(commitInfo.commit_content_hash))
        console.log('commit.previous_content_hash:', bufferToBase64(commitInfo.previous_content_hash))
        console.log('commit.deltas_committed:', commitInfo.deltas_committed)
        console.log('my $session.contentHashStr', $content_hash_str)
        console.log('my next_index', this.next_index())
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
