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
