import { _b } from '@ctx-core/object'
import { sessions_b } from './sessions_b'
import { derived$, Readable$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn/utils/dist'
export const sessions_str_a1_b = _b<sessions_str_a1_T>('sessions_str_a1', (ctx)=>{
    const sessions = sessions_b(ctx)
    const sessions_str_a1 = derived$(sessions, $sessions=>
        $sessions?.map(session=>bufferToBase64(session))
    ) as sessions_str_a1_T
    return sessions_str_a1
})
export type $sessions_str_a1_T = null|string[]
export interface sessions_str_a1_T extends Readable$<$sessions_str_a1_T> {}
