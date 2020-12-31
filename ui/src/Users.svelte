<script>
  import { participants, conn, scribeStr  } from './stores.js';
  import { arrayBufferToHex } from './Syn.svelte';
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
  }
</style>
<div class="users">
  {#if $conn && $conn.me}
    <User me={true} pubKeyStr={$conn.me} pubKey={$conn.agentPubKey}/>
  {/if}
  {#each Object.keys($participants) as p}
    <User pubKeyStr={p} pubKey={$participants[p].pubKey}/>
  {/each}
</div>
