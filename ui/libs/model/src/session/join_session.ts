import type { AppSignal } from '@holochain/conductor-api'
import { clone } from '@ctx-core/object'
import { I } from '@ctx-core/combinators'
import { subscribe_wait_timeout } from '@ctx-core/store'
import { bufferToBase64 } from '@syn-ui/utils'
import {
  app_id_b, app_port_b, app_ws_cb_b, decodeJson, me_b, rpc_get_session_b,
  rpc_new_session_b, rpc_send_sync_request_b, SessionInfo,
} from '@syn-ui/zome-client'
import { apply_delta_fn_T, apply_delta_fn_b } from '../delta'
import { SyncReq_ops_b } from './SyncReq_ops_b'
import { sessions_b } from './sessions_b'
import { session_info_b } from './session_info_b'
import { SyncResp_ops_b } from './SyncResp_ops_b'
import { am_i_scribe_b } from './am_i_scribe_b'
import { ChangeReq_ops_b } from './ChangeReq_ops_b'
import { Change_ops_b } from './Change_ops_b'
import type { Ops } from './Ops'
import { FolkLore_ops_b } from './FolkLore_ops_b'
import { Heartbeat_ops_b } from './Heartbeat_ops_b'
export async function join_session(params:join_session_params_T) {
  const ctx = params.ctx || {}
  const me = me_b(ctx)
  const sessions = sessions_b(ctx)
  const ops:Ops = clone(
    Change_ops_b(ctx),
    ChangeReq_ops_b(ctx),
    FolkLore_ops_b(ctx),
    Heartbeat_ops_b(ctx),
    SyncReq_ops_b(ctx),
    SyncResp_ops_b(ctx),
  )
  app_ws_cb_b(ctx).set($app_ws_cb)
  app_id_b(ctx).set(params.app_id)
  app_port_b(ctx).set(params.app_port)
  apply_delta_fn_b(ctx).set(params.apply_delta_fn)
  const $sessions = await subscribe_wait_timeout(sessions, I, 10_000)
  const session_info = session_info_b(ctx)
  let $session_info:SessionInfo
  if ($sessions.length === 0) {
    $session_info = await rpc_new_session_b(ctx)()
    sessions.unshift($session_info.session)
  } else {
    $session_info = await rpc_get_session_b(ctx)($sessions[0])
    if (am_i_scribe_b(ctx).$) {
      await rpc_send_sync_request_b(ctx)($session_info)
    }
  }
  session_info.set($session_info)
  async function $app_ws_cb(signal:AppSignal) {
    // ignore signals not meant for me
    if (bufferToBase64(signal.data.cellId[1]) !== me.$) {
      return
    }
    const { signal_name } = signal.data.payload
    console.log('Got Signal', signal_name, signal)
    const op = ops[signal_name]
    if (!op) {
      console.warn(`Undefined Op: ${signal_name}`)
    }
    await op(signal)
    switch (signal.data.payload.signal_name) {
      case 'SyncReq':
        await SyncReq_ops_b(ctx)
        break
      case 'SyncResp':
        await SyncResp_ops_b(ctx)
        break
      case 'ChangeReq':
        await ChangeReq_ops_b(ctx)
        break
      case 'Change':
        await Change_ops_b(ctx)
        break
      case 'FolkLore': {
        FolkLore_ops_b(ctx)
        break
      }
      case 'Heartbeat': {
        Heartbeat_ops_b(ctx)
        break
      }
      case 'CommitNotice':
        connection.session.commitNotice(signal.data.payload.signal_payload)
    }
  }
}
export interface join_session_params_T {
  app_port:number
  app_id:string
  apply_delta_fn:apply_delta_fn_T
  ctx?:object
}
