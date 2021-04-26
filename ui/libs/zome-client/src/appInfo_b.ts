import type { InstalledAppInfo } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { derived$, Readable$ } from '@ctx-core/store'
import { app_ws_b } from './app_ws_b'
import { app_id_b } from './app_id_b'
export const appInfo_b = _b('appInfo', (ctx)=>{
  const app_id = app_id_b(ctx)
  const app_ws = app_ws_b(ctx)
  const appInfo:appInfo_T = derived$([app_ws, app_id], ([$app_ws, $app_id], set)=>{
    if (!$app_ws || !$app_id) return
    (async()=>{
      set(await $app_ws.appInfo({ installed_app_id: $app_id }))
    })()
  })
  return appInfo
})
export type $appInfo_T = InstalledAppInfo
export interface appInfo_T extends Readable$<$appInfo_T> {}
