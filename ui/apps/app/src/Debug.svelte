<script lang="ts">
  import { getContext } from 'svelte'
  import { content_hash_str_b, next_index_b, session_info_scribe_str_b, session_info_b } from '@syn/model'
  import { dna_b } from '@syn/zome-client'
  const ctx = getContext('ctx')
  const dna = dna_b(ctx)
  const session_info_scribe_str = session_info_scribe_str_b(ctx)
  const next_index = next_index_b(ctx)
  const session_info = session_info_b(ctx)
  const content_hash_str = content_hash_str_b(ctx)
</script>
<style>
ul {
  margin-bottom: 1rem;
}
</style>
<div>
  <ul>
    <li>
      {#if $dna}
        Connected to Dna: {$dna}
      {:else}
        No connection
      {/if}
    <li>lastCommitedContentHash: {$content_hash_str ? $content_hash_str : ''}
    <li>session: {JSON.stringify($session_info)}
    <li>next_index: {$next_index}
    <li>scribe: {$session_info_scribe_str}
  </ul>
</div>
