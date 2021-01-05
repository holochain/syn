<script>
  import { session, connection, scribeStr, nextIndex } from './stores.js'
</script>
<style>
ul {
  margin-bottom: 1rem;
}
</style>
<div>
  <ul>
    <li>
      {#if $connection}
        Connected to Dna: {$connection.Dna}
      {:else}
        No connection
      {/if}
    <li>lastCommitedContentHash: {$session ? $session.contentHashStr : ''}
    <li>session: {JSON.stringify($session)}
    <li>nextIndex: {$nextIndex}
    <li>scribe: {$scribeStr}
  </ul>
</div>
