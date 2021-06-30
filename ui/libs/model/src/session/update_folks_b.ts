import type { AgentPubKey } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { bufferToBase64 } from '@syn-ui/utils'
import {
    Folk, FOLK_GONE, FOLK_SEEN, FOLK_UNKNOWN, FolkStatus, PubKeyToFolkRecord
} from '@syn-ui/zome-client'
import { getFolkColors } from '../colors'
import { folks_b } from './folks_b'
export const update_folks_b = _b('update_folks', (ctx)=>{
    const folks = folks_b(ctx)
    return update_folks
    function update_folks(pubKey:AgentPubKey, status:FolkStatus, meta?:number) {
        const pubKeyStr = bufferToBase64(pubKey)
        // if we don't have this key, create a record for it
        // including the default color
        const $folks = folks.$
        _other($folks, pubKeyStr, pubKey)
        if (meta) {
            $folks[pubKeyStr]['meta'] = meta
        }
        switch (status) {
            case FOLK_SEEN:
                $folks[pubKeyStr]['inSession'] = true
                $folks[pubKeyStr]['lastSeen'] = Date.now()
                break
            case FOLK_GONE:
            case FOLK_UNKNOWN:
                $folks[pubKeyStr]['inSession'] = false
        }
        folks.$ = $folks
    }
    function _other($folks:PubKeyToFolkRecord, pubKeyStr:string, pubKey:AgentPubKey) {
        if (!(pubKeyStr in $folks)) {
            const colors = getFolkColors(pubKey)
            $folks[pubKeyStr] = { pubKey, colors } as Folk
        }
    }
})
