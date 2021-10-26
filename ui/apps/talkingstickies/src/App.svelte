<script>
  import Board from './Board.svelte'
  import Toolbar from './Toolbar.svelte'
  import { scribeStr, content } from './stores.js'
  import { SynContext } from '@syn/elements';
  import { createStore } from './syn';
  import { setContext } from 'svelte';

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

  $: sortOption = null

  function setSortOption (newSortOption) {
    console.log('setting sort option', newSortOption)
    sortOption = newSortOption
  }

  let synStore;
  createStore().then(async store => {
    const sessions = await store.getAllSessions();

    if (Object.keys(sessions).length === 0) {
      store.newSession().then(() => {
        synStore = store;
      });
    } else {
      await store.joinSession(Object.keys(sessions)[0]);
      synStore = store;
    }
  });
  $: synStore;

  customElements.define('syn-context', SynContext);
  // customElements.define('syn-sessions', SynSessions);
  // customElements.define('syn-folks', SynFolks);

  setContext('store', {
    getStore: () => synStore,
  });

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
  {#if synStore}
    <Toolbar setSortOption={setSortOption} sortOption={sortOption} />
    <Board
      sortOption={sortOption} />
  {/if}
</div>