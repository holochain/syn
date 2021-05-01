import type { AgentPubKey } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { rpc_b } from './rpc_b'
import { encodeJson } from './encodeJson'
import type { PubKeyToFolkRecord } from './Folk'
export const rpc_send_folk_lore_b = _b('rpc_send_folk_lore', (ctx)=>{
    const rpc = rpc_b(ctx)
    return function rpc_send_folk_lore({ participants, data }:SendFolkLoreInput) {
        if (participants.length) {
            const serialized_data = encodeJson(data)
            return rpc('send_folk_lore', { participants, data: serialized_data })
        }
    }
})
export interface SendFolkLoreInput {
    participants:AgentPubKey[]
    data:SendFolkLoreInputData
}
export interface SendFolkLoreInputData {
    participants?:PubKeyToFolkRecord,
    gone?:AgentPubKey[]
}
