import type { AppSignalCb } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
export const app_ws_cb_b = _b('app_ws_cb', ()=>
  writable$<AppSignalCb>(()=>
    console.warn('Unhandled app_ws callback: app_ws_cb should be set')
  )
)
