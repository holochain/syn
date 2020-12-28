<script>
  import {callZome, session, connection} from './Admin.svelte';
  import Admin from './Admin.svelte';
  let content = {
    title: 'loading session...',
    body: 'loading session',
  }
  let newTitle = '';

  function applyDeltas(deltas) {
    for (const delta of deltas) {
      switch(delta.type) {
      case "Title":
        content.title = delta.value
        break
      case "Add":
        const [loc, text] = delta.value
        content.body = content.body.slice(0, loc) + text + content.body.slice(loc)
        break
      case "Delete":
        const [start, end] = delta.value
        content.body = content.body.slice(0, start) + content.body.slice(end)
        break
      }
    }
  }

  function requestChange(delta) {
    if (session.scribeStr == connection.me) {
      applyDeltas([delta])
    } else {
      callZome('send_change_request', {scribe: session.scribe, delta});
    }
  }

  let editingTitle = false;
  function toggleEditingTitle() {
    if (editingTitle) {
      let delta = { type: 'Title', value: newTitle};
      requestChange(delta);
      newTitle = "";
    } else {
      newTitle = content.title;
    }
    editingTitle = !editingTitle;
  }

  function setState(event) {
    content = event.detail
  }

</script>

<style>

  h1 {
    color: blue;
  }

</style>
<Admin on:setState={setState}/>
<div>
  <div>
    Title:
    {#if editingTitle}
    <input bind:value={newTitle}/>
    {:else}
    {content.title}
    {/if}

    <button on:click={toggleEditingTitle} change>
    {#if editingTitle}
    save
    {:else}
    change
    {/if}
    </button>
  </div>
<textarea bind:value={content.body}/>
</div>
