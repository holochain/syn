<script>
  import { createEventDispatcher } from 'svelte'
  import { content } from './stores.js'
  import StickyEditor from './StickyEditor.svelte'

  const dispatch = createEventDispatcher()

  $: stickies = $content.body.length === 0 ? [] : JSON.parse($content.body)

  let creating = false

  const newSticky = () => {
    creating = true
  }

  const addSticky = text => {
    dispatch('requestChange', [
      {type: 'add-sticky', value: {text}}
    ])
    creating = false
  }

  const cancelSticky = () => {
    creating = false
  }

</script>

<style>
  .board {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: 500px;
    background-color: white;
  }
  .sticky {
    background-color: #C5FFFD;
    width: 200px;
    height: 100px;
    margin: 20px;
    padding: 20px;
    box-shadow: 4px 5px 13px 0px rgba(0,0,0,0.38);

  }
  .add {
    background-color: #FFBFB7;
    box-shadow: 4px 5px 13px 0px rgba(0,0,0,0.38);
    display: flex;
    align-items: center;
    max-height: 30px;
    padding: 10px;
    margin: 20px;
    border: 0px;
  }
</style>

<div class='board'>
  {#each stickies as sticky}
    <div class='sticky'>{sticky}</div>
  {/each}
  {#if creating}
    <StickyEditor {addSticky} {cancelSticky} />
  {:else}
    <button class="add" on:click={newSticky}>+ Add</button>
  {/if}
</div>
