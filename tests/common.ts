import { HoloHash } from '@holochain/conductor-api'
export type Add = [number, string]
export type Delete = [number, number]
export type Title = string

// Signal type definitions
export type Delta = {
    type: string,
    value: Add | Delete | Title,
}

export type StateForSync = {
    snapshot: HoloHash,
    commit: HoloHash,
    deltas: Delta[],
}

export type Signal = {
    signal_name: string,
    signal_payload?
}

export const delay = ms => new Promise(r => setTimeout(r, ms));
