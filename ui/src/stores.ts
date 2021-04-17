import { writable, derived, Writable } from 'svelte/store'
import type { Session } from './Session'
import type { Connection } from './Connection'
import type { ApplyDelta } from './ApplyDelta'
import type { PubKeyToFolkRecord } from './Folk'

export const session:Writable<Session> = writable(null)

export interface $content_T {
  title:string
  body:string
  meta?:Record<string, number>
}
export interface content_T extends Writable<$content_T> {}
export const content:content_T = writable({ title: '', body: '' })

export interface folks_T extends Writable<PubKeyToFolkRecord> {}
export const folks = writable({})

export const connection:Writable<Connection> = writable(null)

export const scribeStr = writable('')

export type $requestedChanges_T = ApplyDelta[]
export interface requestedChanges_T extends Writable<$requestedChanges_T> {}
export const requestedChanges:requestedChanges_T = writable([])

export type $recordedChanges_T = ApplyDelta[]
export interface recordedChanges_T extends Writable<$recordedChanges_T> {}
export const recordedChanges:recordedChanges_T = writable([])

export type $committedChanges_T = ApplyDelta[]
export interface committedChanges_T extends Writable<$committedChanges_T> {}
export const committedChanges:committedChanges_T = writable([])

export const nextIndex = derived(
  recordedChanges,
  c=>c.length
)
