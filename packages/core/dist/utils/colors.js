import { decodeHashFromBase64 } from '@holochain/client';
export function CSSifyHSL(hslArray) {
    const [h, s, l] = hslArray;
    return `hsl(${h} ${s}% ${l}%)`;
}
// retruns binary input as hex number string (e.g. 'a293b8e1a')
function arrayBufferToHex(buffer) {
    let hexString = '';
    for (const byte of buffer) {
        hexString += byte.toString(16);
    }
    return hexString;
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
    const hexColor = '#' + arrayBufferToHex(decodeHashFromBase64(pubKey)).slice(-6);
    // extract the RGB components from the hex color notation.
    // Source: https://stackoverflow.com/questions/3732046
    const r = parseInt(hexColor.substr(1, 2), 16); // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    return {
        r,
        g,
        b,
    };
}
//# sourceMappingURL=colors.js.map