<script>
  import { participants, connection, scribeStr  } from './stores.js';
  import User from './User.svelte';
</script>
<style>
  :global(:root) {
    --users-padding: .75em;
    --users-grid-gap: 1rem;
  }
  .users {
    display: grid;
    grid-gap: var(--users-grid-gap);
    padding: var(--users-grid-gap) var(--users-padding) var(--users-padding);
    place-items: center;
  }
</style>
<div class="users">
  {#if $connection && $connection.me}
    <User me={true} pubKeyStr={$connection.me} pubKey={$connection.agentPubKey}/>
  {/if}
  {#each Object.keys($participants) as p}
    <User pubKeyStr={p} pubKey={$participants[p].pubKey}/>
  {/each}
</div>
