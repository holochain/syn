import { session_info_b } from '../session'
import { request_checker_timer_b, scribe_heartbeat_timer_b } from '../timers'
export async function leave_session(params:leave_session_params_I) {
    const ctx = params.ctx || {}
    const session_info = session_info_b(ctx)
    session_info.$ = null
    const request_checker_timer = request_checker_timer_b(ctx)
    request_checker_timer.stop()
    const scribe_heartbeat_timer = scribe_heartbeat_timer_b(ctx)
    scribe_heartbeat_timer.stop()
    return ctx
}
export interface leave_session_params_I {
    ctx?:object
}
