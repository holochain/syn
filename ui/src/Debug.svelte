<script lang="ts">
  import { getContext } from 'svelte'
  import { nextIndex_b } from './delta'
  import { connection_b } from './connection'
  import { session_b } from './session'
  import { scribeStr_b } from './scribe'
  const ctx = getContext('ctx')
  const scribeStr = scribeStr_b(ctx)
  const connection = connection_b(ctx)
  const nextIndex = nextIndex_b(ctx)
  const session = session_b(ctx)
</script>
<style>
ul {
  margin-bottom: 1rem;
}
</style>
<div>
  <ul>
    <li>
      {#if $connection && $connection.syn}
        Connected to Dna: {$connection.syn.Dna}
      {:else}
        No connection
      {/if}
    <li>lastCommitedContentHash: {$session ? $session.contentHashStr : ''}
    <li>session: {JSON.stringify($session)}
    <li>nextIndex: {$nextIndex}
    <li>scribe: {$scribeStr}
  </ul>
</div>
