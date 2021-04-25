import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn-ui/utils'
import { snapshot_hash_b } from './snapshot_hash_b'
export const snapshot_hash_str_b = _b('snapshot_hash_str', (ctx) => {
  const snapshot_hash = snapshot_hash_b(ctx)
  return derived$(snapshot_hash, $snapshot_hash=>
    $snapshot_hash ? bufferToBase64($snapshot_hash) : null
  )
})
