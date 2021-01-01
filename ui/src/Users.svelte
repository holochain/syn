<script>
  import { folks, connection, scribeStr  } from './stores.js';
  import Folk from './User.svelte';
</script>
<style>
  :global(:root) {
    --folks-padding: .75em;
    --folks-grid-gap: 1rem;
  }
  .folks {
    display: grid;
    grid-gap: var(--folks-grid-gap);
    padding: var(--folks-grid-gap) var(--folks-padding) var(--folks-padding);
    place-items: center;
  }
</style>
<div class="folks">
  {#if $connection && $connection.me}
    <Folk me={true} pubKeyStr={$connection.me} pubKey={$connection.agentPubKey}/>
  {/if}
  {#each Object.keys($folks) as p}
    <Folk pubKeyStr={p} pubKey={$folks[p].pubKey}/>
  {/each}
</div>
