<script lang="ts">
  import { folks, connection } from './stores'
  import Folk from './Folk.svelte'
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
<div class='folks'>
  {#if $connection && $connection.syn && $connection.syn.me}
    <Folk me={true} pubKeyStr={$connection.syn.me}/>
  {/if}
  {#each Object.keys($folks) as p}
    <Folk pubKeyStr={p}/>
  {/each}
</div>
