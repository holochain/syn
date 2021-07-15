import { base64ToBuffer } from '@syn/utils'
import type { ApiResponse } from './ApiResponse'
export function decodeJson(jsonStr:string):ApiResponse {
    return JSON.parse(jsonStr, function (key:string, value:string) {
        // the receiver function looks for the typed array flag
        try {
            if (key == 'pubKey') {
                return base64ToBuffer(value)
            }
        } catch (e) {
            console.warn('decodeJson Error:', e)
        }

        // if flag not found no conversion is done
        return value
    })
}
