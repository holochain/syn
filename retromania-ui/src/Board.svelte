<script>
  import { createEventDispatcher } from 'svelte'
  import { content, connection } from './stores.js'
  import StickyEditor from './StickyEditor.svelte'

  let stickies = [
    "One sticky",
    "Two sticky",
    "Three sticky"
  ]

  let creating = true

  const addSticky = () => {
    creating = true
  }

  const saveSticky = text => {
    stickies = [...stickies, text]
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
    <StickyEditor { saveSticky } {cancelSticky} />
  {:else}
    <button class="add" on:click={addSticky}>+ Add</button>
  {/if}
</div>
