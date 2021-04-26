<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import { my_tag_b } from '@syn-ui/zome-client'
  import type { Delta } from '@syn-ui/zome-client'
  import { content_b, CSSifyHSL, my_colors_b, session_info_b } from '@syn-ui/model'

  const ctx = getContext('ctx')
  const dispatch = createEventDispatcher()
  const content = content_b(ctx)
  const session_info = session_info_b(ctx)
  const my_tag = my_tag_b(ctx)
  const my_colors = my_colors_b(ctx)

  function getLoc(tag) {
    return $content.meta ? ($content.meta[tag] ? $content.meta[tag] : 0) : 0
  }

  let editor
  $: editor_content1 = $content.body.slice(0, getLoc($my_tag))
  $: editor_content2 = $content.body.slice(getLoc($my_tag))

  function addText(text) {
    const loc = getLoc($my_tag)
    const deltas:Delta[] = [{type:'Add', value:[loc, text]}]
    for (const [tag, tagLoc] of Object.entries($content.meta)) {
      if (tagLoc >= loc) {
        deltas.push({type:'Meta', value: {setLoc: [tag,tagLoc+text.length] }})
      }
    }
    dispatch('request_change', deltas)
  }

  function handleInput(event) {
    const loc = getLoc($my_tag)
    const key = event.key
    if (key.length == 1) {
      addText(key)
    } else {
      switch (key) {
      case 'ArrowRight':
        if (loc < $content.body.length) {
          dispatch('request_change', [
            {type:'Meta', value:{setLoc: [$my_tag, loc+1]}}
          ])
        }
        break
      case 'ArrowLeft':
        if (loc > 0){
          dispatch('request_change', [
            {type:'Meta', value:{setLoc: [$my_tag, loc-1]}}
          ])
        }
        break
      case 'Enter':
        addText('\n')
        break
      case 'Backspace':
        if (loc>0) {
          const deltas:Delta[] = [{type:'Delete', value:[loc-1, loc]}]
          for (const [tag, tagLoc] of Object.entries($content.meta)) {
            if (tagLoc >=  loc) {
              deltas.push({type:'Meta', value: {setLoc: [tag,tagLoc-1] }})
            }
          }
          dispatch('request_change', deltas)
        }
      }
    }
    console.log('input', event.key)
  }
  function handleClick(e) {
    const offset = window.getSelection().focusOffset
    let loc = offset > 0 ? offset : 0
    if (window.getSelection().focusNode.parentElement == editor.lastChild) {
      loc += editor_content1.length
    }
    if (loc != getLoc($my_tag)) {
      dispatch('request_change', [
        {type:'Meta', value:{setLoc: [$my_tag, loc]}}
      ])
    }
  }

  let cursor
  $: {
    // wait for cursor and connection and color inside connection to exist
    // before updating the cursor color
    if ($my_colors) {
      cursor.style['border-color'] = CSSifyHSL($my_colors.primary)
    }
  }

</script>
<style>
  editor {
    width: auto;
    min-height: 10em;
    border: 1px solid black;
    background-color: hsla(0, 0%, 100%, .6);
    font-family: Arial;
    display: block;
    white-space: pre-wrap;
    margin: 1em 0 .4em 0;
    padding: 4px;
  }
  .cursor {
    display: inline;
    border-left: solid 2px; /* Should be the Folk's main color */
    margin-right: -2px;
    z-index: 10;
    position: relative;
  }
</style>
<editor on:click={handleClick} on:keydown={handleInput} tabindex=0 start=0 bind:this={editor}>
  <span>{editor_content1}</span><span class='cursor' bind:this={cursor}></span><span>{editor_content2}</span>
</editor>
