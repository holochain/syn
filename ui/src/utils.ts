export const bufferToBase64 = buffer=>{
  if (typeof window !== 'undefined') {
    // browser
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  } else {
    // nodejs
    return buffer.toString('base64')
  }
}

export const base64ToBuffer = base64=>{
  if (!base64) return
  if (typeof window !== 'undefined') {
    return Uint8Array.from(window.atob(base64), c=>c.charCodeAt(0))
  } else {
    return Buffer.from(base64, 'base64')
  }
}
export interface Participant extends Buffer {
  pubKey:Buffer
  meta:number
}
export interface ApiResponse extends Record<string, any> {
  pubKey:Buffer
  gone?:boolean
  participants:Participant[]
}
export function decodeJson(jsonStr:string):ApiResponse {
  return JSON.parse(jsonStr, function (key:string, value:string) {
    // the receiver function looks for the typed array flag
    try {
      if (key == 'pubKey') {
        return base64ToBuffer(value)
      }
    } catch (e) {
      console.log('decodeJson Error:', e)
    }

    // if flag not found no conversion is done
    return value
  })
}

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
