<script>
  import { content } from './stores.js';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let editor
  let loc = 0
  $: editor_content = $content.body.slice(0, loc) + "|" + $content.body.slice(loc)

  function handleInput(event) {
    const key = event.key
    if (key.length == 1) {
      dispatch("requestChange", {type:'Add', value:[loc, key]})
      loc += 1
    } else {
      switch (key) {
      case "ArrowRight":
        if (loc < $content.body.length){
          loc+=1
        }
        break;
      case "ArrowLeft":
        if (loc > 0){
          loc-=1
        }
        break;
      case "Enter":
        dispatch("requestChange", {type:'Add', value:[loc, "\n"]})
        loc += 1
        break;
      case "Backspace":
        if (loc>0) {
          dispatch("requestChange", {type:'Delete', value:[loc-1, loc]})
          loc -=1
        }
      }
    }
    console.log("input", event.key)
  }
  function handleClick(e) {
    const offset = window.getSelection().focusOffset;
    loc = offset > 0 ? offset -1 : 0

  }
</script>
<style>
  editor {
    width:100%;
    min-height: 10em;
    border: 1px solid black;
    display: block;
    font-family: monospace;
    white-space: pre-wrap;
    margin: 1em 0;
    padding: 4px;
  }
</style>

<editor on:click={handleClick} on:keydown={handleInput} tabindex=0 start=0 bind:this={editor}>
  {editor_content}
</editor>
