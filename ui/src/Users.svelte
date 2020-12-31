<script>
  import { participants } from './stores.js';
  import {arrayBufferToBase64} from './Syn.svelte';
  import { conn, scribeStr } from './stores.js';
  import User from './User.svelte';
</script>
<style>
</style>
<div class="users">
  Users:
  {#if $conn && $conn.me}
    <User pubKeyStr={$conn.me}/>
  {/if}
  {#each Object.keys($participants) as p}
    <User pubKeyStr={p}/>
  {/each}
</div>
