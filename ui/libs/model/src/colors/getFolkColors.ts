import type { AgentPubKey } from '@holochain/conductor-api'
import type { FolkColors } from '@syn-ui/zome-client'
import { arrayBufferToHex } from './arrayBufferToHex'
import { rgbToHsl } from './rgbToHsl'
import { clamp } from './clamp'
// Generate an object of colors for a folk from their pubKey
// returns Object:
//           primary: Color,            // used for hex outline and norrmal cursor
//           hexagon: Color,            // used for hexagon picture placeholder
//           selection: Color,          // used for normal selection
//           lookingSelection: Color,   // used for selection when "looking at"
//           lookingCursor: Color,      // used for cursor when "looking at"
// where Color is array: [h, s, l]
// used in `use:setColor` on new Folk components
export function getFolkColors(pubKey:AgentPubKey):FolkColors {
  // get a hex color from the folk's public key
  const hexColor = '#' + arrayBufferToHex(pubKey).slice(-6)
  // extract the RGB components from the hex color notation.
  // Source: https://stackoverflow.com/questions/3732046
  const r = parseInt(hexColor.substr(1, 2), 16) // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
  const g = parseInt(hexColor.substr(3, 2), 16)
  const b = parseInt(hexColor.substr(5, 2), 16)
  // convert to HSL
  let hsl = rgbToHsl(r, g, b)
  // limit color to be bright enough and not too bright
  hsl[1] = clamp(hsl[1], 10, 90) // limit s
  const [h, s] = hsl // destructure
  return {
    primary: [h, s, 50],
    hexagon: [h, s, 25],
    selection: [h, s, 90], // placeholder values from here down
    lookingSelection: [h, s, 80],
    lookingCursor: [h, s + 10, 40],
  }
}
