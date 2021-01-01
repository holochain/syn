<script>
  import Editor from './Editor.svelte';
  import Title from './Title.svelte';
  import Users from './Users.svelte';
  import Syn from './Syn.svelte';
  import {requestChange} from './Syn.svelte';
  $: disconnected = false
  import { content, scribeStr } from './stores.js';

  function applyDeltas(deltas) {
    for (const delta of deltas) {
      switch(delta.type) {
      case "Title":
        $content.title = delta.value
        break
      case "Add":
        const [loc, text] = delta.value
        $content.body = $content.body.slice(0, loc) + text + $content.body.slice(loc)
        break
      case "Delete":
        const [start, end] = delta.value
        $content.body = $content.body.slice(0, start) + $content.body.slice(end)
        break
      }
    }
  }
  $: noscribe = $scribeStr === ""

</script>

<style>
	main {
		padding: 1em;
    background: hsla(100, 20%, 50%, .2);
    grid-column: 1 / 2;
	}

  .toolbar {
    background: hsla(19, 20%, 50%, .2);
    padding: 2rem;
    grid-column: 1 / 2;
  }

  .participants-tray {
    min-width: calc((var(--users-padding) * 2) + var(--participant-hex-width));
    width: auto;
    background: hsla(255, 20%, 50%, .2);
    grid-column: 2 / 3;
    grid-row: 1/4;
  }

  .debug-drawer {
    background: hsla(180, 30%, 40%, .2);
    padding: 2rem;
    text-align: center;
    grid-column: 1 / 2;
  }

  body {
    font-family: system-ui, sans-serif;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
    margin: auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<div class="toolbar">
  <h1>SynText</h1>
<div class:noscribe>
    <Title on:requestChange={(event) => requestChange(event.detail)}/>
</div>
</div>

<main>
<div class:noscribe>
  <Editor on:requestChange={(event) => requestChange(event.detail)}/>
</div>
<Syn applyDeltas={applyDeltas} />
</main>

<div class="participants-tray">
  <Users />
</div>

<div class="debug-drawer">This is a footer that should be hideable and have debug</div>
