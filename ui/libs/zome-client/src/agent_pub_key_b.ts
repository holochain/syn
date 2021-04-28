import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { cell_id_b } from './cell_id_b'
export const agent_pub_key_b = _b('agent_pub_key', (ctx)=>{
  const cell_id = cell_id_b(ctx)
  return derived$(cell_id, $cell_id=>
    $cell_id?.[1]
  )
})
