import type { InstalledAppInfo, AppWebsocket } from '@holochain/conductor-api'
import { _b, assign } from '@ctx-core/object'
import { _readable_set_ctx$, derived$, Readable$, Writable$ } from '@ctx-core/store'
import { app_ws_b } from './app_ws_b'
import { app_id_b } from './app_id_b'
import { app_port_b } from './app_port_b'
export const appInfo_b = _b('appInfo', (ctx)=>{
    const app_id = app_id_b(ctx)
    const app_ws = app_ws_b(ctx)
    const app_port = app_port_b(ctx)
    const { store: appInfo_frame, set: set_appInfo_frame } = _readable_set_ctx$<$appInfo_frame_T>({
        $app_ws: app_ws.$,
        $app_id: app_id.$,
        $app_port: app_port.$,
        done: false,
    })
    const appInfo:appInfo_T = assign(
        derived$([app_ws, app_id, app_port], ([$app_ws, $app_id, $app_port], set)=>{
            if (!$app_ws || !$app_id || !$app_port) return
            const $appInfo_frame = { $app_ws, $app_id, $app_port, done: false }
            if (_is_current($appInfo_frame)) return
            set_appInfo_frame($appInfo_frame)
            ;(async ()=>{
                const $appInfo = await $app_ws.appInfo({ installed_app_id: $app_id })
                if (!_is_current($appInfo_frame)) return
                set($appInfo)
                set_appInfo_frame(assign($appInfo_frame, { done: true }))
            })()
        }), {
            appInfo_frame
        }
    ) as appInfo_T
    return appInfo
    function _is_current(compare_$appInfo_frame:$appInfo_frame_T) {
        const $appInfo_frame = appInfo_frame.$
        return (
            $appInfo_frame.$app_ws === compare_$appInfo_frame.$app_ws
            && $appInfo_frame.$app_id === compare_$appInfo_frame.$app_id
            && $appInfo_frame.$app_port === compare_$appInfo_frame.$app_port
        )
    }
})
export type $appInfo_T = InstalledAppInfo
export interface $appInfo_frame_T {
    $app_ws?:AppWebsocket
    $app_id?:string
    $app_port?:number
    done:boolean
}
export interface appInfo_T extends Readable$<$appInfo_T>, $appInfo_frame_T {
    appInfo_frame:Writable$<$appInfo_frame_T>
}
