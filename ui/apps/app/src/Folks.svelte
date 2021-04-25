<script lang="ts">
  import { folks_b } from '@syn-ui/model'
  import { connection_b } from '@syn-ui/zome-client'
  import Folk from './Folk.svelte'
  import { getContext } from 'svelte'
  const ctx = getContext('ctx')
  const folks = folks_b(ctx)
  const connection = connection_b(ctx)
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
