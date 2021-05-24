<script>
  import { createEventDispatcher } from 'svelte'
  import { content } from './stores.js'

  const dispatch = createEventDispatcher()

  $: stickies = $content.body.length === 0 ? [] : JSON.parse($content.body)



</script>

<style>
  .toolbar {
  }
</style>

<div class='toolbar'>
  <h1>Talking Stickies</h1>
</div>
