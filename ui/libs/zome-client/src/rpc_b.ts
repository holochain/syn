import type { AppWebsocket } from '@holochain/conductor-api'
import { _b } from '@ctx-core/object'
import { I } from '@ctx-core/combinators'
import { subscribe_wait_timeout } from '@ctx-core/store'
import { console_b } from '@syn-ui/utils'
import { app_ws_b } from './app_ws_b'
import { cell_id_b } from './cell_id_b'
import { agent_pub_key_b } from './agent_pub_key_b'
import { appInfo_b } from './appInfo_b'
export const rpc_b = _b('rpc', (ctx)=>{
    const console = console_b(ctx)
    const app_ws = app_ws_b(ctx)
    const cell_id = cell_id_b(ctx)
    const agent_pub_key = agent_pub_key_b(ctx)
    return rpc
    async function rpc(fn_name:string, payload?:any, timeout?:number) {
        try {
            const zome_name = 'syn'
            console.log(`Making zome call ${fn_name} with:`, payload)
            const $app_ws = await subscribe_wait_timeout(app_ws, I, 10_000) as AppWebsocket
            await subscribe_wait_timeout(appInfo_b(ctx), I, 10_000)
            const $cell_id = await subscribe_wait_timeout(cell_id, I, 10_000)
            const $agent_pub_key = await subscribe_wait_timeout(agent_pub_key, I, 10_000)
            const result = await $app_ws.callZome(
                {
                    cap: null,
                    cell_id: $cell_id,
                    zome_name,
                    fn_name,
                    provenance: $agent_pub_key,
                    payload
                },
                timeout
            )
            return result
        } catch (error) {
            console.log(`ERROR: rpc ${fn_name}`, { error })
            throw(error)
            //  if (error == 'Error: Socket is not open') {
            // TODO        return doResetConnection(dispatch)
            // }
        }
    }
})
