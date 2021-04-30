import {
  _$app_ws, app_id_b, app_port_b, app_ws_b, rpc_get_session_b, rpc_new_session_b,
  rpc_send_sync_request_b, SessionInfo,
} from '@syn-ui/zome-client'
import { am_i_scribe_b, session_info_b, sessions_b } from '../session'
import { request_checker_timer_b, scribe_heartbeat_timer_b } from '../timers'
import { app_ws_cb_b } from '../signals'
export async function join_session(params:join_session_params_T) {
  const ctx = params.ctx || {}
  const sessions = sessions_b(ctx)
  const app_id = app_id_b(ctx)
  app_id.$ = params.app_id
  const app_port = app_port_b(ctx)
  app_port.$ = params.app_port
  const app_ws = app_ws_b(ctx)
  app_ws.$ = await _$app_ws(app_port.$, app_ws_cb_b(ctx))
  const $sessions = await sessions.load()
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
      await rpc_send_sync_request($session_info.scribe)
    }
  }
  const session_info = session_info_b(ctx)
  session_info.$ = $session_info
  const request_checker_timer = request_checker_timer_b(ctx)
  request_checker_timer.start()
  const scribe_heartbeat_timer = scribe_heartbeat_timer_b(ctx)
  scribe_heartbeat_timer.start()
  return ctx
}
export interface join_session_params_T {
  app_port:number
  app_id:string
  ctx?:object
}
