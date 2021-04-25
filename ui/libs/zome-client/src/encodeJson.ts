import { bufferToBase64 } from '@syn-ui/utils'
export function encodeJson(obj) {
  return JSON.stringify(obj, function (key, value) {
    if (key == 'pubKey') {
      if (typeof window !== 'undefined') {
        return bufferToBase64(value) // In the browser it's the actual array
      } else {
        return bufferToBase64(Buffer.from(value.data)) // In node it's an object
      }
    }
    return value
  })
}
