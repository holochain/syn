import type { AgentPubKey } from '@holochain/conductor-api'
import type { Participant } from './Participant'
export interface ApiResponse extends Record<string, any> {
  pubKey:AgentPubKey
  gone?:AgentPubKey[]
  participants:Participant[]
}
