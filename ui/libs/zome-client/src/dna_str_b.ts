import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn/utils'
import { dna_b } from './dna_b'
export const dna_str_b = _b('dna_str', (ctx)=>{
    const dna = dna_b(ctx)
    return derived$(dna, $dna=>
        $dna ? bufferToBase64($dna) : null
    )
})
