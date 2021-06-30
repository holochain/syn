// retruns binary input as hex number string (e.g. 'a293b8e1a')
function arrayBufferToHex(buffer){
  let hexString = ''
  for (const byte of buffer) {
    hexString += byte.toString(16)
  }
  return hexString
}

// converts RGB to HSL
// Source: https://gist.github.com/mjackson/5311256
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2;
  if (max == min) { h = s = 0;} else {
      let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      } h /= 6; } return [h*360, s*100, l*100];}

// Source: https://stackoverflow.com/questions/5842747
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// Generate an object of colors for a folk from their pubKey
// returns Object:
//           primary: Color,            // used for hex outline and norrmal cursor
//           hexagon: Color,            // used for hexagon picture placeholder
//           selection: Color,          // used for normal selection
//           lookingSelection: Color,   // used for selection when "looking at"
//           lookingCursor: Color,      // used for cursor when "looking at"
// where Color is array: [h, s, l]
// used in `use:setColor` on new Folk components
export function getFolkColors(pubKey) {
  // get a hex color from the folk's public key
  const hexColor = '#' + arrayBufferToHex(pubKey).slice(-6)
  // extract the RGB components from the hex color notation.
  // Source: https://stackoverflow.com/questions/3732046
  const r = parseInt(hexColor.substr(1,2), 16) // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
  const g = parseInt(hexColor.substr(3,2), 16)
  const b = parseInt(hexColor.substr(5,2), 16)
  // convert to HSL
  let hsl = rgbToHsl(r, g, b)
  // limit color to be bright enough and not too bright
  hsl[1] = clamp(hsl[1], 10, 90) // limit s
  const [h,s,l] = hsl // destructure
  return {
             primary: [h, s, 50],
             hexagon: [h, s, 25],
           selection: [h, s, 90], // placeholder values from here down
    lookingSelection: [h, s, 80],
       lookingCursor: [h, s+10, 40],
  }
}

export function CSSifyHSL(hslArray) {
  const [h,s,l] = hslArray
  return `hsl(${h} ${s}% ${l}%)`
}
