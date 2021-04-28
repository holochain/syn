import type { AppSignal } from '@holochain/conductor-api'
import { clone } from '@ctx-core/object'
import { I } from '@ctx-core/combinators'
import { subscribe_wait_timeout } from '@ctx-core/store'
import { bufferToBase64 } from '@syn-ui/utils'
import {
  app_id_b, app_port_b, app_ws_cb_b, me_b, rpc_get_session_b, rpc_new_session_b,
  rpc_send_sync_request_b, SessionInfo,
} from '@syn-ui/zome-client'
import { apply_delta_fn_T, apply_delta_fn_b } from '../delta'
import { am_i_scribe_b, session_info_b, sessions_b } from '../session'
import {
  Change_SignalOps_b, ChangeReq_SignalOps_b, CommitNotice_SignalOps_b,
  FolkLore_SignalOps_b, Heartbeat_SignalOps_b, SignalOps,
  SyncReq_SignalOps_b, SyncResp_SignalOps_b
} from '../signals'
import { request_checker_timer_b, scribe_heartbeat_timer_b } from '../timers'
export async function join_session(params:join_session_params_T) {
  const ctx = params.ctx || {}
  const me = me_b(ctx)
  const sessions = sessions_b(ctx)
  const signal_ops:SignalOps = clone(
    Change_SignalOps_b(ctx),
    ChangeReq_SignalOps_b(ctx),
    CommitNotice_SignalOps_b(ctx),
    FolkLore_SignalOps_b(ctx),
    Heartbeat_SignalOps_b(ctx),
    SyncReq_SignalOps_b(ctx),
    SyncResp_SignalOps_b(ctx),
  )
  const app_ws_cb = app_ws_cb_b(ctx)
  // app_ws_cb.set($app_ws_cb)
  app_ws_cb.$ = $app_ws_cb
  const app_id = app_id_b(ctx)
  // app_id.set(params.app_id)
  app_id.$ = params.app_id
  const app_port = app_port_b(ctx)
  app_port.$ = params.app_port
  const $apply_delta_fn = params.apply_delta_fn
  const apply_delta_fn = apply_delta_fn_b(ctx)
  apply_delta_fn.$ = $apply_delta_fn
  const $sessions = await subscribe_wait_timeout(sessions, I, 10_000)
  let $session_info:SessionInfo
  if ($sessions.length === 0) {
    const rpc_new_session = rpc_new_session_b(ctx)
    $session_info = await rpc_new_session()
    sessions.unshift($session_info.session)
  } else {
    const rpc_get_session = rpc_get_session_b(ctx)
    $session_info = await rpc_get_session($sessions[0])
    const am_i_scribe = am_i_scribe_b(ctx)
    if (am_i_scribe.$ === true) {
      const rpc_send_sync_request = rpc_send_sync_request_b(ctx)
      await rpc_send_sync_request($session_info)
    }
  }
  const session_info = session_info_b(ctx)
  session_info.$ = $session_info
  const request_checker_timer = request_checker_timer_b(ctx)
  request_checker_timer.start()
  const scribe_heartbeat_timer = scribe_heartbeat_timer_b(ctx)
  scribe_heartbeat_timer.start()
  return ctx
  async function $app_ws_cb(signal:AppSignal) {
    // ignore signals not meant for me
    if (bufferToBase64(signal.data.cellId[1]) !== me.$) {
      return
    }
    const { signal_name } = signal.data.payload
    console.log('Got Signal', signal_name, signal)
    const signal_payload_op = signal_ops[signal_name]
    if (!signal_payload_op) {
      console.warn(`Undefined SignalOp: ${signal_name}`)
    }
    await signal_payload_op(signal)
  }
}
export interface join_session_params_T {
  app_port:number
  app_id:string
  apply_delta_fn:apply_delta_fn_T
  ctx?:object
}
