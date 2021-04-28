import { Buffer } from 'buffer'
export { Buffer }
window.Buffer = Buffer
declare global {
  interface Window {
    Buffer:typeof Buffer
  }
}
