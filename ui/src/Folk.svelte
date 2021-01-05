<script>
  export let pubKeyStr = ''
  export let pubKey
  export let me = false
  import { scribeStr, folks, connection } from './stores.js'
  import { CSSifyHSL } from './colors.js'
  $: scribe = pubKeyStr == $scribeStr

  function setUpHex(hexEl) {
    let colors
    if (me) {
      colors = $connection.myColors
    } else {
      colors = $folks[pubKeyStr].colors
    }
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
{#if $connection}
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
{/if}
