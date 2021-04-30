import { _b } from '@ctx-core/object'
import { derived$ } from '@ctx-core/store'
import { appInfo_b } from './appInfo_b'
export const cell_id_b = _b('cell_id', (ctx)=>{
  const appInfo = appInfo_b(ctx)
  return derived$(appInfo, $appInfo=>{
    return $appInfo?.cell_data?.[0]?.cell_id
  })
})
