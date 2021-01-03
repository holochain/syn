<script>
  import {session, connection, scribeStr, nextIndex} from './stores.js';
</script>
<style>
ul {
  margin-bottom: 2rem;
}
</style>
<div>
  <h4>Debug data:</h4>
  <ul>
    <li>
      {#if $connection}
        Connected to Dna: {$connection.Dna}
      {:else}
        No connection
      {/if}
    <li>session: {JSON.stringify($session)}
    <li>nextIndex: {$nextIndex}
    <li>scribe: {$scribeStr}
  </ul>
</div>
