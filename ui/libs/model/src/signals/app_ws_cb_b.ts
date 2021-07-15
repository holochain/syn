import type { AppSignal } from '@holochain/conductor-api'
import { _b, clone } from '@ctx-core/object'
import { bufferToBase64, console_b } from '@syn/utils'
import { me_b } from '@syn/zome-client'
import {
    Change_SignalOps_b, ChangeReq_SignalOps_b, CommitNotice_SignalOps_b,
    FolkLore_SignalOps_b, Heartbeat_SignalOps_b,
    SignalOps, SyncReq_SignalOps_b, SyncResp_SignalOps_b
} from '../signals'
export const app_ws_cb_b = _b('app_ws_cb', (ctx)=>{
    const console = console_b(ctx)
    const me = me_b(ctx)
    const signal_ops:SignalOps = clone(
        Change_SignalOps_b(ctx),
        ChangeReq_SignalOps_b(ctx),
        CommitNotice_SignalOps_b(ctx),
        FolkLore_SignalOps_b(ctx),
        Heartbeat_SignalOps_b(ctx),
        SyncReq_SignalOps_b(ctx),
        SyncResp_SignalOps_b(ctx),
    )
    return app_ws_cb
    async function app_ws_cb(signal:AppSignal) {
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
})
