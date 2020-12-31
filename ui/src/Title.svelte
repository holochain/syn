<script>
  import { content } from './stores.js';
  import { createEventDispatcher } from 'svelte';
  import { tick } from 'svelte';
  const dispatch = createEventDispatcher();

  let titleBeingTyped = '';

  let editingTitle = false;
  function saveTitle() {
    if (editingTitle) {
      let delta = { type: 'Title', value: titleBeingTyped}
      dispatch("requestChange", delta)
      titleBeingTyped = ''
      editingTitle = false
    } else {
      console.log("Can't saveTitle when it wasn't being edited!")
    }
  }

  let titleEl // variable to bind the
  async function beginEditTitle() {
    console.log("beginning edit title")
    titleBeingTyped = $content.title // fill the field with the current title
    editingTitle = true
    await tick() // wait for the title input element to be created
    titleEl.focus()
  }

  function handleTitleKeypress() {
    // console.log("Keypress in field detected!", event)
		if (event.key == "Enter") {
      saveTitle()
    } else if (event.key == "Escape") {
      // return to past
      console.log("test");
      // turn off editing
      editingTitle=false
    }
  }

  // keep track of whether the doc is untitled
  let untitled
  $: untitled = ($content.title === '')

  let titleHover // whether the title is being hovered


</script>
<style>
  .title {
    /* min-width: 10em;
    min-height: 1em; */
    font-weight: bold;
    display: inline;
    padding: 0.4em;
    -webkit-padding: 0.4em 0;
    margin: 0 0 0.5em 0;
  }

  .title-hover {
    border: 1px dashed #eee;
  }

  /* input has to be below hover so it overrides */
  .title-input {
  border: 1px solid #ccc;
  border-radius: 2px;
  }

  .untitled {
    color: lightgray;
  }
</style>

  <div>
    Title:
    <div class="title" class:title-input={editingTitle} class:title-hover={titleHover} on:mouseenter={()=>{titleHover=true}} on:mouseleave={()=>{titleHover=false}} on:click={beginEditTitle}>
      {#if editingTitle}
        <input bind:value={titleBeingTyped} on:keydown={handleTitleKeypress} on:blur={saveTitle} bind:this={titleEl}/>
      {:else}
        <span class:untitled>
          {#if untitled}
            Untitled Document
          {:else}
            {$content.title}
          {/if}
        </span>
      {/if}
    </div>
  </div>
