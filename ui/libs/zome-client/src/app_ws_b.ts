import { AppSignal, AppSignalCb, AppWebsocket } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { derived$, Readable } from '@ctx-core/store'
import { app_port_b } from './app_port_b'
import { app_ws_cb_b } from './app_ws_cb_b'
export const app_ws_b = _b('app_ws', (ctx)=>{
  const app_port = app_port_b(ctx)
  const app_ws_cb = app_ws_cb_b(ctx)
  let $app_ws:AppWebsocket
  return derived$(app_port, ($app_port, set)=>{
    if (!$app_port) return
    (async ()=>{
      if ($app_ws) {
        await $app_ws.client.close()
      }
      $app_ws = await _app_ws($app_port, (signal:AppSignal)=>{
        app_ws_cb.$(signal)
      })
      set($app_ws)
    })()
  }) as Readable<AppWebsocket>
})

export async function _app_ws(app_port:number, signal_fn:AppSignalCb) {
  return await AppWebsocket.connect(
    `ws://localhost:${app_port}`,
    30000,
    (signal)=>signal_fn(signal))
}
