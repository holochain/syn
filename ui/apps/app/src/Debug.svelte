<script lang="ts">
  import { getContext } from 'svelte'
  import { next_index_b } from './delta'
  import { connection_b } from './zome'
  import { session_b } from './session'
  import { scribe_str_b } from './scribe'
  const ctx = getContext('ctx')
  const scribe_str = scribe_str_b(ctx)
  const connection = connection_b(ctx)
  const next_index = next_index_b(ctx)
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
    <li>next_index: {$next_index}
    <li>scribe: {$scribe_str}
  </ul>
</div>
