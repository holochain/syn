import { _b } from '@ctx-core/object'
import { folks_b } from '../session'
export const _scribe_signal_folk_pubKey_a1_b = _b('_scribe_signal_folk_pubKey_a1', (ctx) => {
  const folks = folks_b(ctx)
  return function _scribe_signal_folk_pubKey_a1() {
    return Object.values(folks.$).filter(v=>v.inSession).map(v=>v.pubKey)
  }
})
