import type { HoloHash } from '@holochain/conductor-api'
// returns binary input as hex number string (e.g. 'a293b8e1a')
export function arrayBufferToHex(buffer:HoloHash) {
  let hexString = ''
  for (const byte of buffer) {
    hexString += byte.toString(16)
  }
  return hexString
}
