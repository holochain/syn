<script>
  export let pubKeyStr = ''
  export let pubKey
  export let me = false
  import { scribeStr } from './stores.js';
  $: scribe = pubKeyStr == $scribeStr

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

  // Generate a color for a user from their pubKey
  // returns HSL array: [h,s,l]
  // used in `use:setColor` on new User components
  function getUserColor(pubKey) {
    // get a hex color from the user's public key
    const raw_color = '#' + arrayBufferToHex(pubKey).slice(-6)
    // extract the RGB components from the hex color notation.
    // Source: https://stackoverflow.com/questions/3732046
    const r = parseInt(raw_color.substr(1,2), 16); // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
    const g = parseInt(raw_color.substr(3,2), 16);
    const b = parseInt(raw_color.substr(5,2), 16);
    // convert to HSL
    const hsl = rgbToHsl(r, g, b)
    // limit color to be bright enough and colorful enough
    let [h, s, l] = hsl
    let s_corrected = clamp(s, 10, 90)
    let l_corrected = clamp(l, 25, 75)
    return [h, s_corrected, l_corrected]
  }

  function setColor(el) {
    let [h,s,l] = getUserColor(pubKey)
    let mainColorString = `hsl(${h} ${s}% ${l}%)`
    let picPlaceholderColorString = `hsl(${h} ${s}% ${l*.5}%)`
    el.style['background-color'] = mainColorString
    el.firstChild.style['background-color'] = picPlaceholderColorString
  }

</script>
<style>
  :global(:root) {
    --participant-hex-width: 60px;
    --participant-hex-height: calc(var(--participant-hex-width) * .8666);
    --hex-border: 4px;
    --scribe-hex-width: calc(var(--participant-hex-width) - 2 * var(--hex-border));
    --scribe-hex-height: calc(var(--participant-hex-height) - 2 * var(--hex-border));
  }
  .user {
    display: grid;
    width: var(--participant-hex-width);
    height: var(--participant-hex-height);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    place-items: center;
    color: white;
    text-shadow: 0 0 5px black;
    cursor: pointer;
  }
  .user-color {
    z-index: -1;
    content: '';
    width: calc(var(--participant-hex-width) - (var(--hex-border)) * 2);
    height: calc(var(--participant-hex-height) - (var(--hex-border)) * 2);
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
    width: var(--participant-hex-width);
    height: var(--participant-hex-height);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%, 1% 50%, 28% 97%, 72% 97%, 97% 50%, 72% 3%, 28% 3%, 25% 0%); /* FIXME not right shape yet */
    background-color: grey;
    position: absolute;
  }
  .scribe {
    margin: var(--hex-border) 0;
    width: var(--scribe-hex-width);
    height: var(--scribe-hex-height);
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
    <div use:setColor class='user scribe' class:me>
      <div class='scribe-color'></div>
      {pubKeyStr.slice(-4)}
    </div>
    <div class='scribe-halo'></div>
  </div>
{:else}
  <div use:setColor class='user' class:me>
    <div class='user-color' class:scribe-color={scribe}></div>
    {pubKeyStr.slice(-4)}
  </div>
{/if}
