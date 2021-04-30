import { Buffer } from 'buffer'
export { Buffer }
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
}
declare global {
  interface Window {
    Buffer:typeof Buffer
  }
}
