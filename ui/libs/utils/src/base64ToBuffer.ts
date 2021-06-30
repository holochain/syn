export const base64ToBuffer = base64=>{
    if (!base64) return
    if (typeof window !== 'undefined') {
        return Uint8Array.from(window.atob(base64), c=>c.charCodeAt(0))
    } else {
        return Buffer.from(base64, 'base64')
    }
}
