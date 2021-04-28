import type { HoloHash } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
export const current_commit_header_hash_b = _b('current_commit_header_hash', ()=>
  writable$<HoloHash|null>(null)
)
