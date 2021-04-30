import { AppSignal, AppSignalCb, AppWebsocket } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { derived$, Readable$ } from '@ctx-core/store'
import { app_port_b } from './app_port_b'
import { app_ws_cb_b } from './app_ws_cb_b'
export const app_ws_b = _b('app_ws', (ctx)=>{
  const app_port = app_port_b(ctx)
  const app_ws_cb = app_ws_cb_b(ctx)
  const app_ws:app_ws_T = derived$(app_port, ($app_port, set)=>{
    if (!$app_port) return
    if (app_ws.$app_port === $app_port) {
      return
    }
    app_ws.$app_port = $app_port
    const close_client = app_ws.$?.client
    ;(async ()=>{
      try {
        set(await _app_ws($app_port, (signal:AppSignal)=>{
          app_ws_cb.$(signal)
        }))
      } finally {
        if (close_client) {
          await close_client.close()
        }
      }
    })()
  })
  return app_ws
})
export async function _app_ws(app_port:number, signal_fn:AppSignalCb) {
  return await AppWebsocket.connect(
    `ws://localhost:${app_port}`,
    30000,
    (signal)=>signal_fn(signal))
}
export type $app_ws_T = null|AppWebsocket
export interface app_ws_T extends Readable$<$app_ws_T> {
  $app_port?:number
}
