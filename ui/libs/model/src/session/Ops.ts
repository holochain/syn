import type { AppSignal } from '@holochain/conductor-api'
export type Op = (signal:AppSignal)=>Promise<void>
export interface Ops extends Record<string, Op> {}
