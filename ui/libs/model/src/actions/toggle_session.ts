import { clone } from '@ctx-core/object'
import { session_info_b } from '../session'
import type { join_session_params_T } from './join_session'
import { leave_session } from './leave_session'
import { join_session } from './join_session'
export async function toggle_session(params:join_session_params_T) {
    const ctx = params.ctx || {}
    const session_info = session_info_b(ctx)
    return (
        session_info.$
        ? leave_session({ ctx })
        : join_session(
            clone<join_session_params_T>(params, { ctx })
        )
    )
}
