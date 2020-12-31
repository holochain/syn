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
    titleHover=false
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
  .title-wrapper {
    height: 1.6em;
  }

  .title {
    /* min-width: 10em;
    min-height: 1em; */
    font-weight: bold;
    display: inline-block;
    padding: 0.4em;
    -webkit-padding: 0.4em 0;
    margin: 0 0 0.5em 0;
    border-width: 1px;
    border-color: #00000000;
    border-style: solid;
    border-radius: 2px;
  }

  .title-hover {
    border-style: dashed;
    border-color: #aaa;
  }

  /* input has to be below hover so it overrides */
  .title-input {
  border-style: solid;
  border-color: #ccc;
  font-weight: bold;
  margin-bottom: 0;
  }

  .untitled {
    color: lightgray;
  }
</style>

  <div class="title-wrapper">
    Title:
    {#if editingTitle}
      <input class="title-input" bind:value={titleBeingTyped} on:keydown={handleTitleKeypress} on:blur={saveTitle} bind:this={titleEl}/>
    {:else}
      <div class="title" class:title-hover={titleHover} on:mouseenter={()=>{titleHover=true}} on:mouseleave={()=>{titleHover=false}} on:click={beginEditTitle}>
        <span class:untitled>
          {#if untitled}
            Untitled Document
          {:else}
            {$content.title}
          {/if}
        </span>
      </div>
    {/if}
  </div>
