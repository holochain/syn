<script>
  export let pubKeyStr = ''
  export let pubKey
  export let me = false
  import { scribeStr } from './stores.js';

  // retruns binary input as hex number string (e.g. 'a293b8e1a')
  function arrayBufferToHex(buffer){
    let hexString = '';
    for (const byte of buffer) {
      hexString += byte.toString(16);
    }
    return hexString;
  };

  // converts RGB to HSL
  // Source: https://gist.github.com/mjackson/5311256
  function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b); var h, s, l = (max + min) / 2;
    if (max == min) { h = s = 0;} else {
        var d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        } h /= 6; } return [h*360, s*100, l*100];}

  // Source: https://stackoverflow.com/questions/5842747
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // set the color of an element
  // called by `use:setColor` on new User components
  function setColor(el) {
    // get a hex color from the user's public key
    const raw_color = '#' + arrayBufferToHex(pubKey).slice(-6)
    console.log(raw_color);
    // extract the RGB components from the hex color notation.
    // Source: https://stackoverflow.com/questions/3732046
    const r = parseInt(raw_color.substr(1,2), 16); // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
    const g = parseInt(raw_color.substr(3,2), 16);
    const b = parseInt(raw_color.substr(5,2), 16);
    // convert to HSL
    const hsl = rgbToHsl(r, g, b)
    console.log('Raw HSL color:', hsl);
    // limit color to be bright enough and colorful enough
    let [h, s, l] = hsl
    let s_corrected = clamp(s, 10, 100)
    let l_corrected = clamp(l, 10, 90)
    return `hsl(${h} ${s_corrected}% ${l_corrected}%)`
    console.log('Corrected color:', color);
    console.log('Setting color of user hex:', el, `to ${color}`)
    el.firstChild.style['background-color'] = color
  }

</script>
<style>
  :global(:root) {
    --user-hex-width: 60px;
    --user-hex-height: calc(var(--user-hex-width) * .8666);
    --user-hex-border: 2px;
  }
  .user {
    display: grid;
    width: var(--user-hex-width);
    height: var(--user-hex-height);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    place-items: center;
    color: white;
    text-shadow: 0 0 5px black;
    cursor: pointer;
  }
  .user-color {
    z-index: -1;
    content: '';
    width: calc(var(--user-hex-width) - (var(--user-hex-border)) * 2);
    height: calc(var(--user-hex-height) - (var(--user-hex-border)) * 2);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    position: absolute;
  }

  .scribe {
    background-color: skyblue;
  }
  .participant {
    background-color: black;
  }
  .me {
    background-color: black;
  }
</style>
<div use:setColor class='user {pubKeyStr == $scribeStr ? 'scribe' : 'participant'}' class:me>
  <div class='user-color'></div>
  {pubKeyStr.slice(-4)}
</div>
