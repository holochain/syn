<script>
  import { participants, conn, scribeStr  } from './stores.js';
  import { arrayBufferToHex } from './Syn.svelte';
  import User from './User.svelte';
</script>
<style>
  .users {
    display: grid;
    grid-gap: 1em;
    padding: 1em .75rem .75rem .75rem;
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
