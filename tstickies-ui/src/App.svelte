<script>
  import Syn from './Syn.svelte'
  import Board from './Board.svelte'
  import Toolbar from './Toolbar.svelte'
  import { scribeStr } from './stores.js'

  // definition of how to apply a delta to the content
  // if the delta is destructive also returns what was
  // destroyed for use by undo
  function applyDelta(content, delta) {
    switch(delta.type) {
    case 'add-sticky':
      {
        const stickies = content.body.length === 0
          ? []
          : JSON.parse(content.body)
        content.body = JSON.stringify([...stickies, delta.value])
        return [content, {delta}]
      }
    case 'update-sticky':
      {
        const stickies = content.body.length === 0
          ? []
          : JSON.parse(content.body)
        const updatedStickies = stickies.map(sticky => {
          if (sticky.id === delta.value.id) {
            return delta.value
          } else {
            return sticky
          }
        })
        console.log('updated stickies', JSON.stringify(updatedStickies))
        content.body = JSON.stringify(updatedStickies)
        return [content, {delta, deleted: stickies.find(sticky => sticky.id === delta.value.id)}]
      }
    case 'delete-sticky':
      {
        const stickies = content.body.length === 0
          ? []
          : JSON.parse(content.body)
        content.body = JSON.stringify(stickies.filter(sticky => sticky.id !== delta.value.id))
        return [content, {delta, deleted: stickies.find(sticky => sticky.id === delta.value.id)}]
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

  $: agentPubkey = ''

  function setAgentPubkey (newAgentPubkey) {
    console.log('setting agent pubkey', newAgentPubkey)
    agentPubkey = newAgentPubkey
  }

  $: sortOption = null

  function setSortOption (newSortOption) {
    console.log('setting sort option', newSortOption)
    sortOption = newSortOption
  }

  // The debug drawer's ability to resized and hidden
  let resizeable
  let resizeHandle
  const minDrawerSize = 0
  const maxDrawerSize = document.documentElement.clientHeight - 30 - 10
  const initResizeable = (resizeableEl) => {
    resizeableEl.style.setProperty('--max-height', `${maxDrawerSize}px`)
    resizeableEl.style.setProperty('--min-height', `${minDrawerSize}px`)
  }

  const setDrawerHeight = (height) => {
    document.documentElement.style.setProperty('--resizeable-height', `${height}px`)
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
      setDrawerHeight(Math.min(Math.max((yOffset - moveEvent.pageY ) + startingDrawerHeight, minDrawerSize), maxDrawerSize))
    }
    const remove = window.addEventListener('pointermove', mouseDragHandler)
  }

  let drawerHidden = true
  const hideDrawer = () => {
    drawerHidden = true
  }
  const showDrawer = () => {
    drawerHidden = false
  }

  let tabShown = false;
  const showTab = () => {
    tabShown = true
  }
  const hideTab = () => {
    tabShown = false
  }

</script>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 1000px;
  }
	main {
		padding: 1em;
    background: hsla(100, 20%, 50%, .2);
    grid-column: 1 / 2;
	}

  :global(:root) {
    --resizeable-height: 200px;
    --tab-width: 60px;
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

<svelte:head>
  <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
</svelte:head>

<div class='app'>
  <Toolbar setSortOption={setSortOption} sortOption={sortOption} />
  <Board
    on:requestChange={(event) => syn.requestChange(event.detail)}
    agentPubkey={agentPubkey}
    sortOption={sortOption} />
  <Syn applyDeltaFn={applyDelta} undoFn={undo} bind:this={syn} setAgentPubkey={setAgentPubkey} />
</div>