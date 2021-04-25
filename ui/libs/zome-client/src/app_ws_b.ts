import { AppSignal, AppSignalCb, AppWebsocket } from '@holochain/conductor-api'
import { _b, B } from '@ctx-core/object'
import { derived$, Readable } from '@ctx-core/store'
import { app_port_b } from './app_port_b'
import { app_ws_cb_b } from './app_ws_cb_b'
export const app_ws_b:app_ws_b_T = _b('app_ws', (ctx)=>{
  const app_port = app_port_b(ctx)
  const app_ws_cb = app_ws_cb_b(ctx)
  return derived$(app_port, ($app_port, set)=>{
    (async ()=>{
      set(
        await _app_ws($app_port, (signal:AppSignal) =>{
          app_ws_cb.$(signal)
        })
      )
    })()
  })
})
export type $app_ws_T = AppWebsocket
export interface app_ws_T extends Readable<$app_ws_T> {}
export interface app_ws_b_T extends B<app_ws_T> {}

export async function _app_ws(app_port:number, signal_fn:AppSignalCb) {
  return await AppWebsocket.connect(
    `ws://localhost:${app_port}`,
    30000,
    (signal)=>signal_fn(signal))
}
// function signal_fn(signal:AppSignal) {
//   // ignore signals not meant for me
//   if (!connection.syn || bufferToBase64(signal.data.cell_id[1]) != connection.syn.me) {
//     return
//   }
//   console.log('Got Signal', signal.data.payload.signal_name, signal)
//   switch (signal.data.payload.signal_name) {
//     case 'SyncReq':
//       connection.session.syncReq({ from: signal.data.payload.signal_payload })
//       break
//     case 'SyncResp':
//       const state = signal.data.payload.signal_payload
//       state.deltas = state.deltas.map(d=>JSON.parse(d))
//       connection.session.syncResp(state)
//       break
//     case 'ChangeReq': {
//       let [index, deltas] = signal.data.payload.signal_payload
//       deltas = deltas.map(d=>JSON.parse(d))
//       connection.session.changeReq([index, deltas])
//       break
//     }
//     case 'Change': {
//       let [index, deltas] = signal.data.payload.signal_payload
//       deltas = deltas.map(d=>JSON.parse(d))
//       connection.session.change(index, deltas)
//       break
//     }
//     case 'FolkLore': {
//       let data = decodeJson(signal.data.payload.signal_payload)
//       connection.session.folklore(data)
//       break
//     }
//     case 'Heartbeat': {
//       let [from, jsonData] = signal.data.payload.signal_payload
//       const data = decodeJson(jsonData)
//       connection.session.heartbeat(from, data)
//       break
//     }
//     case 'CommitNotice':
//       connection.session.commitNotice(signal.data.payload.signal_payload)
//   }
// }
