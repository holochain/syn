<script>
  import { createEventDispatcher } from 'svelte'
  import { content } from './stores.js'
  import StickyEditor from './StickyEditor.svelte'
  import PlusIcon from './icons/PlusIcon.svelte'
  import { v1 as uuidv1 } from 'uuid';

  const dispatch = createEventDispatcher()

  $: stickies = $content.body.length === 0 ? [{
    id: '1',
    text: 'A retro item'
  },{
    id: '2',
    text: 'Improve awesomeness'
  }, {
    id: '3',
    text: 'An unusually long sticky to test what happens with unusually long stickies. But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?'
  },
  {
    id: '4',
    text: 'Fix small absence of awesomeness'
  }
] : JSON.parse($content.body)

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
    flex-direction: column;
    min-height: 500px;
    padding: 30px 60px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    flex: 1;
  }
  .stickies {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .sticky {
    background-color: #D4F3EE;
    flex-basis: 212px;
    min-height: 100px;
    margin: 25px;
    padding: 20px;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    text-align: center;
    color: #000000;
  }
  .add-sticky {
    display: flex;
    align-items: center;
    max-height: 30px;
  }
  .add-sticky  :global(svg) {
    margin-right: 6px;
  }
</style>

<div class='board'>
  <div class='add-sticky' on:click={newSticky}>
    <PlusIcon  />Add Sticky
  </div>
  <div class='stickies'>
    {#each stickies as { id, text} (id)}
      {#if editingStickyId === id}
        <StickyEditor handleSave={updateSticky(id)} handleDelete={deleteSticky(id)} {cancelEdit} {text} />
      {:else}
        <div class='sticky' on:click={editSticky(id)}>{text}</div>
      {/if}
    {/each}
    {#if creating}
      <StickyEditor handleSave={addSticky} {cancelEdit} />
    {:else if stickies.length > 0}
      <div on:click={newSticky}>
        <PlusIcon  />
      </div>
    {/if}
  </div>
</div>