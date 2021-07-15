import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { bufferToBase64 } from '@syn/utils'
import { agent_pub_key_b } from './agent_pub_key_b'
export const me_b = _b('me', (ctx)=>{
    const agent_pub_key = agent_pub_key_b(ctx)
    return derived$(agent_pub_key, $agent_pub_key=>
        $agent_pub_key ? bufferToBase64($agent_pub_key) : null
    )
})
