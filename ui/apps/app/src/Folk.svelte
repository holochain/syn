<script lang="ts">
  import { getContext } from 'svelte'
  import { CSSifyHSL, folks_b, my_colors_b, session_info_scribe_str_b, session_info_b } from '@syn/model'
  const ctx = getContext('ctx')
  const folks = folks_b(ctx)
  const session_info_scribe_str = session_info_scribe_str_b(ctx)
  const my_colors = my_colors_b(ctx)
  const session_info = session_info_b(ctx)

  export let pubKeyStr = ''
  export let me = false

  let scribe
  $: scribe = pubKeyStr == $session_info_scribe_str

  let outOfSession
  $: outOfSession = $folks?.[pubKeyStr]?.inSession && !me
  function setUpHex(hexEl) {
      let colors
      if (me) {
          colors = $my_colors
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
    --scribe-scale: 0.8666
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
    z-index: -10;
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
    width: var(--folk-hex-width);
    height: var(--folk-hex-height);
    /* https://www.desmos.com/calculator/bgt97otugr */
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 12.5% 75%, calc(12.5% + 1.732px) calc(75% - 1px), calc(25% + 1.15px) calc(100% - 2px), 50% calc(100% - 2px), 50% 100%, 75% 100%, 87.5% 75%, calc(87.5% - 1.732px) calc(75% - 1px), calc(100% - 2.31px) 50%, calc(87.5% - 1.732px) calc(25% + 1px), 87.5% 25%, 75% 0%, 50% 0%, 50% calc(0% + 2px), calc(25% + 1.15px) calc(0% + 2px), calc(12.5% + 1.732px) calc(25% + 1px), 12.5% 25%);
    background-color: hsl(0, 0%, 10%);
    position: absolute;
  }
  .scribe {
    margin: var(--hex-border) 0;
    scale: var(--scribe-scale);
  }
  .me {
  }

  .out-of-session { /* folk hex outline */
    background-color: goldenrod !important;
  }
  .out-of-session div { /* folk-color */
    background-color: goldenrodyellow !important;
    /* FIXME: this should grey out the hex instead of make it yellow :)*/
  }

</style>
{#if $session_info}
  {#if scribe}
    <div class='scribe-wrapper'>
      <div use:setUpHex class='folk scribe' class:me class:out-of-session={outOfSession}>
        <div class='folk-color'></div>
        {pubKeyStr.slice(-4)}
      </div>
      <div class='scribe-halo'></div>
    </div>
  {:else}
    <div use:setUpHex class='folk' class:me class:out-of-session={outOfSession}>
      <div class='folk-color'></div>
      {pubKeyStr.slice(-4)}
    </div>
  {/if}
{/if}
