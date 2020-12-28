<script>
import {callZome} from './Admin.svelte';

let title = 'Default title';
let content = 'Default content';
let newTitle = '';

let editingTitle = false;
function toggleEditingTitle() {
  if (editingTitle) {
    title = newTitle;
    newTitle = "";
  } else {
    newTitle = title;
  }
  editingTitle = !editingTitle;
}

// whenever title is updated, send a HC zome changeReq

$: {
  let delta = { type: 'Title', value: title};
  callZome('send_change_request', {scribe: delta: delta});
}
</script>

<style>

  h1 {
    color: blue;
  }

</style>

<div>
  <div>
    Title:
    {#if editingTitle}
    <input bind:value={newTitle}/>
    {:else}
    {title}
    {/if}

    <button on:click={toggleEditingTitle} change>
    {#if editingTitle}
    save
    {:else}
    change
    {/if}
    </button>
  </div>
<textarea bind:value={content}/>
</div>
