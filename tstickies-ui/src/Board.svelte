<script>
  import { createEventDispatcher } from 'svelte'
  import { content } from './stores.js'
  import StickyEditor from './StickyEditor.svelte'
  import PlusIcon from './icons/PlusIcon.svelte'
  import { v1 as uuidv1 } from 'uuid';

  const dispatch = createEventDispatcher()

  $: stickies = $content.body.length === 0 ? [] : JSON.parse($content.body)

  let creating = false

  const newSticky = () => {
    creating = true
  }

  let editingStickyId

  const editSticky = id => () => {
    editingStickyId = id
  }

  const addSticky = text => {
    dispatch('requestChange', [
      {type: 'add-sticky', value: {id: uuidv1(), text}}
    ])
    creating = false
  }

  const deleteSticky = id => () => {
    dispatch('requestChange', [
      {type: 'delete-sticky', value: {id}}
    ])
    editingStickyId = null
  }

  const updateSticky = id => text => {
    dispatch('requestChange', [
      {type: 'update-sticky', value: {id, text}}
    ])
    editingStickyId = null
  }

  const cancelEdit = () => {
    creating = false
    editingStickyId = null
  }

</script>

<style>
  .board {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    min-height: 500px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    flex: 1;
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
  {#each stickies as { id, text} (id)}
    {#if editingStickyId === id}
      <StickyEditor handleSave={updateSticky(id)} handleDelete={deleteSticky(id)} {cancelEdit} {text} />
    {:else}
      <div class='sticky' on:click={editSticky(id)}>{text}</div>
    {/if}
  {/each}
  {#if creating}
    <StickyEditor handleSave={addSticky} {cancelEdit} />
  {:else}
    <div on:click={newSticky}>
      dakdaslkdas;l
      <PlusIcon  />
    </div>
  {/if}
</div>