<script>
  import Editor from './Editor.svelte'
  import Title from './Title.svelte'
  import Folks from './Folks.svelte'
  import Syn from './Syn.svelte'
  import Debug from './Debug.svelte'
  import History from './History.svelte'
  import { content, scribeStr } from './stores.js'

  $: disconnected = false

  // definition of how to apply a delta to the content
  // if the delta is destructive also returns what was
  // destroyed for use by undo
  function applyDelta(delta) {
    switch(delta.type) {
    case 'Title':
      {
        const deleted = $content.title
        $content.title = delta.value
        return {delta, deleted}
      }
    case 'Add':
      {
        const [loc, text] = delta.value
        $content.body = $content.body.slice(0, loc) + text + $content.body.slice(loc)
        return {delta}
      }
    case 'Delete':
      {
        const [start, end] = delta.value
        const deleted = $content.body.slice(start,end)
        $content.body = $content.body.slice(0, start) + $content.body.slice(end)
        return {delta, deleted}
      }
    case 'Meta':
      {
        const [tag, loc] = delta.value.setLoc
        const deleted = [tag, $content.meta[tag]]
        $content.meta[tag] = loc
        return {delta, deleted}
      }
    }
  }

  // definition of how to undo a change, returns a delta that will undo the change
  function undo(change) {
    const delta = change.delta
    switch(delta.type) {
    case 'Title':
      return {type:'Title', value:change.deleted}
      break
    case 'Add':
      const [loc, text] = delta.value
      return {type:'Delete', value: [loc, loc+text.length]}
      break
    case 'Delete':
      const [start, end] = delta.value
      return {type:'Add', value:[start, change.deleted]}
      break
    case 'Meta':
      return {type:'Meta', value:{setLoc: change.deleted}}
    }
  }

  // definition of how to convert a change to text for the history renderer
  function changeToText(change) {
    let delta = change.delta
    let detail
    switch(delta.type) {
    case 'Add':
      detail = `${delta.value[1]}@${delta.value[0]}`
      break
    case 'Delete':
      detail = `${change.deleted}@${delta.value[0]}`
      break
    case 'Title':
      detail = `${change.deleted}->${delta.value}`
      break
    case 'Meta':
      detail = ''
    }
    return `${delta.type}:\n${detail}`
  }


  $: noscribe = $scribeStr === ''
  let syn


  let resizeable
  let resizeHandle
  const minDrawerSize = 100
  const maxDrawerSize = document.documentElement.clientHeight - 10
  const initResizeable = (resizeableEl) => {
    resizeableEl.style.setProperty('--max-height', `${maxDrawerSize}px`)
    resizeableEl.style.setProperty('--min-height', `${minDrawerSize}px`)
  }

  const setDrawerHeight = (height) => {
    resizeable.style.setProperty('--resizeable-height', `${height}px`)
  }
  const getDrawerHeight = () => {
    const pxHeight = getComputedStyle(resizeable)
      .getPropertyValue('--resizeable-height')
    return parseInt(pxHeight, 10)
  }

  const startDragging = (event) => {
    event.preventDefault()
    const host = resizeable
    const startingDrawerHeight = getDrawerHeight()
    const yOffset = event.pageY

    const mouseDragHandler = (moveEvent) => {
      moveEvent.preventDefault()
      const primaryButtonPressed = moveEvent.buttons === 1
      if (!primaryButtonPressed) {
        setDrawerHeight(Math.min(Math.max(getDrawerHeight(), minDrawerSize), maxDrawerSize))
        window.removeEventListener('pointermove', mouseDragHandler)
        return
      }
      setDrawerHeight((yOffset - moveEvent.pageY ) + startingDrawerHeight)
    }
    const remove = window.addEventListener('pointermove', mouseDragHandler)
  }

  const hideDrawer = () => {
    resizeable.style.setProperty('--resizeable-height', `${height}px`)
  }

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

  .folks-tray {
    min-width: calc((var(--folks-padding) * 2) + var(--folk-hex-width));
    width: auto;
    background: hsla(255, 20%, 50%, .2);
    grid-column: 2 / 3;
    grid-row: 1/4;
  }

  .debug-drawer {
    --resizeable-height: 200px;
    width: 100%;
    box-sizing: border-box;
    height: var(--resizeable-height);
    min-height: var(--min-height);
    max-height: var(--max-height);
    background: hsla(180, 30%, 85%);
    position: absolute;
    bottom: 0;
    text-align: left;
    grid-column: 1 / 2;
    overflow: hidden;
    z-index: 90;
  }

  .handle {
    height: 1px;
    width: 100%;
    background-color: gray;
    z-index: 100;
  }

  .handle::after {
    content: '';
    height: 9px;
    position: absolute;
    left: 0;
    right: 0;
    margin-bottom: -4px;
    background-color: transparent;
    cursor: ns-resize;
    z-index: 101;
  }

  .debug-content {
    padding: 1rem;
    word-wrap: break-word;
    height: 100%;
    overflow-y: scroll;
    box-sizing: border-box;
    z-index: 90;
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

<div class='toolbar'>
  <h1>SynText</h1>
<div class:noscribe>
    <Title on:requestChange={(event) => syn.requestChange(event.detail)}/>
</div>
</div>
<main>
<div class:noscribe>
  <Editor on:requestChange={(event) => syn.requestChange(event.detail)}/>
</div>


<Syn applyDeltaFn={applyDelta} undoFn={undo} bind:this={syn} />
</main>

<div class='folks-tray'>
  <Folks />
</div>

<div class='debug-drawer' bind:this={resizeable} use:initResizeable>
  <div class='handle' bind:this={resizeHandle} on:mousedown={startDragging}></div>
  <div class='debug-content'>
    <History changeToTextFn={changeToText}/>
    <Debug />
  </div>
</div>
