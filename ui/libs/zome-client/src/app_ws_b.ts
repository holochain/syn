import { AppSignalCb, AppWebsocket } from '@holochain/conductor-api'
import { _b, assign } from '@ctx-core/object'
import { _readable_set_ctx$, Readable$ } from '@ctx-core/store'
import { app_port_b } from './app_port_b'
export const app_ws_b = _b('app_ws', (ctx)=>{
  const app_port = app_port_b(ctx)
  const { store, set } = _readable_set_ctx$<$app_ws_T>(undefined)
  const { store: app_ws_frame, set: set_app_ws_frame } = _readable_set_ctx$<$app_ws_frame_T>(
    _init_$app_ws_frame()
  )
  const app_ws:app_ws_T = assign(store, {
    load,
    close,
    app_ws_frame
  })
  return app_ws
  async function load(signal_fn:AppSignalCb) {
    const $app_port = app_port.$
    if (!$app_port || !($app_port > 0)) throw `app_port.$ must have a value > 0`
    const $app_ws_frame = app_ws_frame.$
    if ($app_ws_frame.$app_port === $app_port) return
    if ($app_ws_frame.$app_ws) {
      await $app_ws_frame.$app_ws.client.socket.close()
    }
    set_app_ws_frame({ $app_port, done: false })
    const $app_ws = await _$app_ws($app_port, signal_fn)
    set_app_ws_frame({ $app_ws, $app_port, done: true })
    set($app_ws)
  }
  async function close() {
    const $app_ws = app_ws.$
    if ($app_ws) {
      await $app_ws.client.socket.close()
    }
    set(undefined)
    set_app_ws_frame(_init_$app_ws_frame())
  }
  function _init_$app_ws_frame() {
    return {
      $app_ws: store.$,
      $app_port: app_port.$,
      done: true
    }
  }
})
export async function _$app_ws(app_port:number, signal_fn:AppSignalCb) {
  return await AppWebsocket.connect(
    `ws://localhost:${app_port}`,
    30000,
    (signal)=>signal_fn(signal))
}
export type $app_ws_T = undefined|AppWebsocket
export interface app_ws_T extends Readable$<$app_ws_T> {
  load(signal_fn:AppSignalCb):Promise<void>
  close():Promise<void>
  app_ws_frame:Readable$<$app_ws_frame_T>
}
export interface $app_ws_frame_T {
  $app_ws?:$app_ws_T
  $app_port?:number
  done:boolean
}
