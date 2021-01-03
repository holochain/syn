<script>
  export let pubKeyStr = ''
  export let pubKey
  export let me = false
  import { scribeStr } from './stores.js'
  $: scribe = pubKeyStr == $scribeStr

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
  function getFolkColors(pubKey) {
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

  function CSSifyHSL(hslArray) {
    const [h,s,l] = hslArray
    return `hsl(${h} ${s}% ${l}%)`
  }

  function setUpHex(hexEl) {
    const colors = getFolkColors(pubKey)
    hexEl.style['background-color'] = CSSifyHSL(colors.primary)
    // hex element's first child is its picture/hexagonColor div
    hexEl.firstChild.style['background-color'] = CSSifyHSL(colors.hexagon)
  }

</script>
<style>
  :global(:root) {
    --folk-hex-width: 60px;
    --folk-hex-height: calc(var(--folk-hex-width) * .8666);
    --hex-border: 4px;
    --scribe-hex-width: calc(var(--folk-hex-width) - 2 * var(--hex-border));
    --scribe-hex-height: calc(var(--folk-hex-height) - 2 * var(--hex-border));
  }
  .folk {
    display: grid;
    width: var(--folk-hex-width);
    height: var(--folk-hex-height);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    place-items: center;
    color: white;
    text-shadow: 0 0 5px black;
    cursor: pointer;
  }
  .folk-color {
    z-index: -1;
    content: '';
    width: calc(var(--folk-hex-width) - (var(--hex-border)) * 2);
    height: calc(var(--folk-hex-height) - (var(--hex-border)) * 2);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    position: absolute;
  }

  .scribe-wrapper {
    display: grid;
    position: relative;
    place-items: center;
  }
  .scribe-halo {
    z-index: -2;
    width: var(--folk-hex-width);
    height: var(--folk-hex-height);
    /* https://www.desmos.com/calculator/bgt97otugr */
    clip-path: polygon(25%0%,75%0%,100%50%,75%100%,25%100%,12.5% 75%,calc(12.5% + 1.732px) calc(75% - 1px),calc(25% + 1.15px) calc(100% - 2px),50% calc(100% - 2px),50% 100%,75% 100%,87.5% 75%,calc(87.5% - 1.732px) calc(75% - 1px),calc(100% - 2.31px) 50%,calc(87.5% - 1.732px) calc(25% + 1px),87.5% 25%,75%0%,50%0%,50% calc(0% + 2px),calc(25% + 1.15px) calc(0% + 2px),calc(12.5% + 1.732px) calc(25% + 1px),12.5% 25%);
    background-color: hsl(0, 0%, 10%);
    position: absolute;
  }
  .scribe {
    margin: var(--hex-border) 0;
    width: var(--scribe-hex-width);
    height: var(--scribe-hex-height);
    /* font-size of scribe hex scales by ratio of normal size to scribe size */
    font-size: calc((52/60) * 1rem);
  }
  .scribe-color{
    z-index: -1;
    content: '';
    width: calc(var(--scribe-hex-width) - (var(--hex-border)) * 2);
    height: calc(var(--scribe-hex-height) - (var(--hex-border)) * 2);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    position: absolute;
  }
  .me {
  }
</style>
{#if scribe}
  <div class='scribe-wrapper'>
    <div use:setUpHex class='folk scribe' class:me>
      <div class='scribe-color'></div>
      {pubKeyStr.slice(-4)}
    </div>
    <div class='scribe-halo'></div>
  </div>
{:else}
  <div use:setUpHex class='folk' class:me>
    <div class='folk-color' class:scribe-color={scribe}></div>
    {pubKeyStr.slice(-4)}
  </div>
{/if}
