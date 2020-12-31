<script>
  import { participants } from './stores.js';
  import {arrayBufferToBase64} from './Holochain.svelte';
  import { conn, scribeStr } from './stores.js';

</script>
<style>
  .user {
    display: inline-block;
    padding: 3px;
  }
  .scribe {
    border: 2px solid red !important;
  }
  .participant {
    border: 2px solid black;
  }
</style>
<div class="users">
  Users:
  {#if $conn && $conn.me}
  <li class="user {$conn.me == $scribeStr ? 'scribe' : 'participant'}">
    me: {$conn.me.slice(-4)}
  </li>
  {/if}
  {#each Object.keys($participants) as p}
  <li class="user {p == $scribeStr ? 'scribe' : 'participant'}">
      {p.slice(-4)}
    </li>
  {/each}
</div>
