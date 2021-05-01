import type { AgentPubKey } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import type { PubKeyToFolkRecord } from '@syn-ui/zome-client'
import { folks_b } from '../session'
export const _scribe_signal_folk_pubKey_a1_b = _b('_scribe_signal_folk_pubKey_a1', (ctx)=>{
    const folks = folks_b(ctx)
    return function _scribe_signal_folk_pubKey_a1():AgentPubKey[] {
        return Object.values(folks.$ as PubKeyToFolkRecord).filter(v=>v.inSession).map(v=>v.pubKey)
    }
})
