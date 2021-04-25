import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { me_b } from './me_b'
export const my_tag_b = _b('my_tag', (ctx) => {
  const me = me_b(ctx)
  return derived$(me, $me =>
    $me ? $me.slice(-4) : null
  )
})
