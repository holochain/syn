<script>
  import { connection } from './stores.js';
  import { createEventDispatcher, getContext } from 'svelte';
  import { CSSifyHSL, synSessionContext } from '@syn/elements';
  import { unnest } from '@syn/store';

  const dispatch = createEventDispatcher();

  const { getStore } = getContext('store');

  const store = getStore();
  $: session = store.activeSession;
  $: content = unnest(store.activeSession, s => s.content);

  function getLoc(tag) {
    return $content.meta ? ($content.meta[tag] ? $content.meta[tag] : 0) : 0;
  }

  let myTag = store.myPubKey.slice(-4);

  let editor;
  $: editor_content1 = $content.body.slice(0, getLoc(myTag));
  $: editor_content2 = $content.body.slice(getLoc(myTag));

  function addText(text) {
    console.log($session, $content.body);
    const loc = getLoc(myTag);
    const deltas = [{ type: 'Add', value: [loc, text] }];
    for (const [tag, tagLoc] of Object.entries($content.meta)) {
      if (tagLoc >= loc) {
        deltas.push({
          type: 'Meta',
          value: { setLoc: [tag, tagLoc + text.length] },
        });
      }
    }
    $session.requestChange(deltas);
  }

  function handleInput(event) {
    const loc = getLoc(myTag);
    const key = event.key;
    if (key.length == 1) {
      addText(key);
    } else {
      switch (key) {
        case 'ArrowRight':
          if (loc < $content.body.length) {
            $session.requestChange([
              { type: 'Meta', value: { setLoc: [myTag, loc + 1] } },
            ]);
          }
          break;
        case 'ArrowLeft':
          if (loc > 0) {
            $session.requestChange([
              { type: 'Meta', value: { setLoc: [myTag, loc - 1] } },
            ]);
          }
          break;
        case 'Enter':
          addText('\n');
          break;
        case 'Backspace':
          if (loc > 0) {
            const deltas = [{ type: 'Delete', value: [loc - 1, loc] }];
            for (const [tag, tagLoc] of Object.entries($content.meta)) {
              if (tagLoc >= loc) {
                deltas.push({
                  type: 'Meta',
                  value: { setLoc: [tag, tagLoc - 1] },
                });
              }
            }
            $session.requestChange(deltas);
          }
      }
    }
    console.log('input', event.key);
  }
  function handleClick(e) {
    const offset = window.getSelection().focusOffset;
    let loc = offset > 0 ? offset : 0;
    if (window.getSelection().focusNode.parentElement == editor.lastChild) {
      loc += editor_content1.length;
    }
    if (loc != getLoc(myTag)) {
      $session.requestChange([
        { type: 'Meta', value: { setLoc: [myTag, loc] } },
      ]);
    }
  }

  let cursor;
  $: {
    // wait for cursor and connection and color inside connection to exist
    // before updating the cursor color
    if (cursor && $connection && $connection.syn && $connection.syn.myColors) {
      cursor.style['border-color'] = CSSifyHSL(
        $connection.syn.myColors.primary
      );
    }
  }
</script>

<editor
  on:click={handleClick}
  on:keydown={handleInput}
  tabindex="0"
  start="0"
  bind:this={editor}
>
  <span>{editor_content1}</span><span class="cursor" bind:this={cursor} /><span
    >{editor_content2}</span
  >
</editor>

<style>
  editor {
    width: auto;
    min-height: 10em;
    border: 1px solid black;
    background-color: hsla(0, 0%, 100%, 0.6);
    font-family: Arial;
    display: block;
    white-space: pre-wrap;
    margin: 1em 0 0.4em 0;
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
