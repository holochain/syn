import type { AppSignal } from '@holochain/conductor-api'
export type SignalOp = (signal:AppSignal)=>Promise<void>
export interface SignalOps extends Record<string, SignalOp> {}
