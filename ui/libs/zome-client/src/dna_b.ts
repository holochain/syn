import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { cell_id_b } from './cell_id_b'
export const dna_b = _b('dna', (ctx)=>{
  const cell_id = cell_id_b(ctx)
  return derived$(cell_id, $cell_id=>
    $cell_id?.[0]
  )
})
