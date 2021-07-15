import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { agent_pub_key_b } from '@syn/zome-client'
import { getFolkColors } from './getFolkColors'
export const my_colors_b = _b('my_colors', (ctx)=>{
    const agent_pub_key = agent_pub_key_b(ctx)
    return derived$(agent_pub_key, $agent_pub_key=>
        $agent_pub_key ? getFolkColors($agent_pub_key) : null
    )
})
