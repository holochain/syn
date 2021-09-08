<script>
  import Editor from './Editor.svelte';
  import Title from './Title.svelte';
  import Debug from './Debug.svelte';
  import History from './History.svelte';
  import { content, scribeStr } from './stores.js';
  import { SynContext, SynFolks, SynSessions } from '@syn/elements';
  import { createStore } from './syn';
  import { setContext } from 'svelte';

  $: disconnected = false;

  // definition of how to convert a change to text for the history renderer
  function changeToText(change) {
    let delta = change.delta;
    let detail;
    switch (delta.type) {
      case 'Add':
        detail = `${delta.value[1]}@${delta.value[0]}`;
        break;
      case 'Delete':
        detail = `${change.deleted}@${delta.value[0]}`;
        break;
      case 'Title':
        detail = `${change.deleted}->${delta.value}`;
        break;
      case 'Meta':
        detail = '';
    }
    return `${delta.type}:\n${detail}`;
  }

  $: noscribe = $scribeStr === '';
  let syn;

  // The debug drawer's ability to resized and hidden
  let resizeable;
  let resizeHandle;
  const minDrawerSize = 0;
  const maxDrawerSize = document.documentElement.clientHeight - 30 - 10;
  const initResizeable = resizeableEl => {
    resizeableEl.style.setProperty('--max-height', `${maxDrawerSize}px`);
    resizeableEl.style.setProperty('--min-height', `${minDrawerSize}px`);
  };

  const setDrawerHeight = height => {
    document.documentElement.style.setProperty(
      '--resizeable-height',
      `${height}px`
    );
  };
  const getDrawerHeight = () => {
    const pxHeight = getComputedStyle(resizeable).getPropertyValue(
      '--resizeable-height'
    );
    return parseInt(pxHeight, 10);
  };

  const startDragging = event => {
    event.preventDefault();
    const host = resizeable;
    const startingDrawerHeight = getDrawerHeight();
    const yOffset = event.pageY;

    const mouseDragHandler = moveEvent => {
      moveEvent.preventDefault();
      const primaryButtonPressed = moveEvent.buttons === 1;
      if (!primaryButtonPressed) {
        setDrawerHeight(
          Math.min(Math.max(getDrawerHeight(), minDrawerSize), maxDrawerSize)
        );
        window.removeEventListener('pointermove', mouseDragHandler);
        return;
      }
      setDrawerHeight(
        Math.min(
          Math.max(
            yOffset - moveEvent.pageY + startingDrawerHeight,
            minDrawerSize
          ),
          maxDrawerSize
        )
      );
    };
    const remove = window.addEventListener('pointermove', mouseDragHandler);
  };

  let drawerHidden = false;
  const hideDrawer = () => {
    drawerHidden = true;
  };
  const showDrawer = () => {
    drawerHidden = false;
  };

  let tabShown = false;
  const showTab = () => {
    tabShown = true;
  };
  const hideTab = () => {
    tabShown = false;
  };

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
  customElements.define('syn-sessions', SynSessions);
  customElements.define('syn-folks', SynFolks);

  setContext('store', {
    getStore: () => synStore,
  });
</script>

<svelte:head>
  <script
    src="https://kit.fontawesome.com/80d72fa568.js"
    crossorigin="anonymous"></script>
</svelte:head>

{#if synStore}
  <div class="toolbar">
    <h1>SynText</h1>
    <div class:noscribe>
      <Title />
    </div>
  </div>
  <main>
    <div class:noscribe>
      <Editor />
    </div>
  </main>

  <div class="folks-tray">
    <syn-context store={synStore}>
      <h3>Folks</h3>
      <syn-folks />
      <h3>Active Sessions</h3>
      <syn-sessions />
    </syn-context>
  </div>

  <div
    class="tab"
    class:shown={tabShown}
    class:drawer-hidden={drawerHidden}
    on:mouseenter={showTab}
    on:mouseleave={hideTab}
  >
    <div
      class="tab-inner"
      class:shown={tabShown}
      on:click={drawerHidden ? showDrawer() : hideDrawer()}
    >
      <i
        class:drawer-hidden={drawerHidden}
        class="tab-icon fas {drawerHidden
          ? 'fa-chevron-up'
          : 'fa-chevron-down'}"
      />
    </div>
  </div>
  <div
    class="debug-drawer"
    bind:this={resizeable}
    use:initResizeable
    on:mouseenter={showTab}
    on:mouseleave={hideTab}
    class:hidden={drawerHidden}
  >
    <div class="handle" bind:this={resizeHandle} on:mousedown={startDragging} />
    <div class="debug-content">
      <History changeToTextFn={changeToText} />
      <Debug />
    </div>
  </div>
{/if}

<style>
  main {
    padding: 1em;
    background: hsla(100, 20%, 50%, 0.2);
    grid-column: 1 / 2;
  }

  .toolbar {
    background: hsla(19, 20%, 50%, 0.2);
    padding: 2rem;
    grid-column: 1 / 2;
  }

  .folks-tray {
    min-width: calc((var(--folks-padding) * 2) + var(--folk-hex-width));
    width: auto;
    background: hsla(255, 20%, 50%, 0.2);
    grid-column: 2 / 3;
    grid-row: 1/4;
  }

  :global(:root) {
    --resizeable-height: 200px;
    --tab-width: 60px;
  }

  .debug-drawer {
    width: 100%;
    box-sizing: border-box;
    height: var(--resizeable-height);
    min-height: var(--min-height);
    max-height: var(--max-height);
    background: hsla(180, 30%, 85%, 1);
    position: absolute;
    bottom: 0;
    text-align: left;
    grid-column: 1 / 2;
    overflow: hidden;
    z-index: 90;
  }

  .hidden {
    height: 0;
    min-height: 0;
  }

  .handle {
    height: 1px;
    width: 100%;
    background-color: hsla(180, 15%, 65%, 1);
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

  /* tab styling reverse-engineered from Atom */
  .tab {
    z-index: 130;
    position: absolute;
    width: var(--tab-width);
    height: calc(var(--tab-width) / 2);
    left: calc(50% - (var(--tab-width) / 2));
    bottom: var(--resizeable-height);
    overflow: hidden;
    margin-bottom: -2px;
    border-top-left-radius: calc(var(--tab-width) / 2);
    border-top-right-radius: calc(var(--tab-width) / 2);

    pointer-events: none;
  }

  .tab-inner {
    position: absolute;
    box-sizing: border-box; /* borders included in size */
    width: var(--tab-width);
    height: var(--tab-width);
    background: hsla(180, 30%, 85%);
    border: 1px solid hsla(180, 20%, 65%, 1);
    color: hsla(180, 20%, 50%, 1); /* color of chevron */
    border-radius: calc(var(--tab-width) / 2);
    cursor: pointer;
    text-align: center;

    top: calc(var(--tab-width) / 2);
    transition: transform 0.2s ease-out 0.2s;
  }

  .tab.shown {
    pointer-events: all;
  }

  .tab-inner.shown {
    transform: translateY(-50%);
    transition: transform 0.2s ease-out 0s;
  }

  /* allow the tab to pop up when drawer is hidden */
  .tab.drawer-hidden {
    bottom: 0;
    pointer-events: all;
  }

  .tab-icon {
    margin-top: 9px;
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
