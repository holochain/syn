<script>
  import Board from './Board.svelte'
  import Toolbar from './Toolbar.svelte'
  import Sessions from './Sessions.svelte'
  import { scribeStr, content } from './stores.js'
  import { createStore } from './syn';
  import { setContext } from 'svelte';

  $: noscribe = $scribeStr === ''

  $: sortOption = null

  function setSortOption (newSortOption) {
    console.log('setting sort option', newSortOption)
    sortOption = newSortOption
  }

  let synStore;
  createStore().then(async store => {
    const sessions = await store.getAllSessions();

    console.log('Creating store')

    if (Object.keys(sessions).length === 0) {
      console.log('Creating new session')
      store.newSession().then(res => {
        console.log('New session hash', res)
        synStore = store;
      });
    } else {
      const sortedSessions = Object.keys(sessions).sort()
      console.log('Sessions exist', sortedSessions)
      console.log('Joining the first', sortedSessions[0])

      await store.joinSession(sortedSessions[0]);
      synStore = store;
    }
  });
  $: synStore;

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
    <Board sortOption={sortOption} />
    <Sessions />
  {/if}
</div>