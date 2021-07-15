import type { AgentPubKey, HoloHash} from '@holochain/conductor-api'
export interface Participant extends HoloHash {
    pubKey:AgentPubKey
    meta:number
}
