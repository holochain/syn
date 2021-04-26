<script lang="ts">
  import { getContext } from 'svelte'
  import { folks_b } from '@syn-ui/model'
  import { me_b } from '@syn-ui/zome-client'
  import Folk from './Folk.svelte'
  const ctx = getContext('ctx')
  const me = me_b(ctx)
  const folks = folks_b(ctx)
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
  {#if $me}
    <Folk me={true} pubKeyStr={$me}/>
  {/if}
  {#each Object.keys($folks) as p}
    <Folk pubKeyStr={p}/>
  {/each}
</div>
