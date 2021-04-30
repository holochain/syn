import { AppSignalCb, AppWebsocket } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { writable$ } from '@ctx-core/store'
export const app_ws_b = _b('app_ws', ()=>{
  return writable$<$app_ws_T>(null)
})
export async function _app_ws(app_port:number, signal_fn:AppSignalCb) {
  return await AppWebsocket.connect(
    `ws://localhost:${app_port}`,
    30000,
    (signal)=>signal_fn(signal))
}
export type $app_ws_T = null|AppWebsocket
