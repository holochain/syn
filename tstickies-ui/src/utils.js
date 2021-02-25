export const bufferToBase64 = buffer => {
  if (typeof window !== "undefined") {
    // browser
    var binary = ''
    var bytes = new Uint8Array(buffer)
    var len = bytes.byteLength
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  } else {
    // nodejs
    return buffer.toString('base64')
  }
}

export const base64ToBuffer = base64 => {
  if (typeof window !== "undefined") {
    return Uint8Array.from(window.atob(base64), c => c.charCodeAt(0))
  } else {
    return Buffer.from(base64, 'base64');
  }
}

export function decodeJson(jsonStr) {
  return JSON.parse( jsonStr, function( key, value ){
    // the receiver function looks for the typed array flag
    try{
      if (key == "pubKey") {
        return base64ToBuffer(value)
      }
    }catch(e){
      console.log("decodeJson Error:", e)
    }

    // if flag not found no conversion is done
    return value
  })
}

export function encodeJson(obj) {
  return JSON.stringify( obj , function( key, value ){
    if (key == "pubKey") {
      if (typeof window !== "undefined") {
        return bufferToBase64(value) // In the browser it's the actual array
      } else {
        return bufferToBase64(Buffer.from(value.data)) // In node it's an object
      }
    }
    return value
  })
}
