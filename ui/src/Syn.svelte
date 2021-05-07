<script>
  import { connection, scribeStr, content, folks } from './stores.js'
  import { createEventDispatcher } from 'svelte'
  import { Connection} from './syn.js'
  import { bufferToBase64 } from './utils.js'

  let session

  // this properties are the app-defined functions to apply and undo changes
  export let applyDeltaFn
  export let undoFn

  // this is the list of sessions returned by the DNA
  let sessions

  export function requestChange(deltas) {
    $session.requestChange(deltas)
  }

  // -----------------------------------------------------------------------

  const dispatch = createEventDispatcher()

  let appHost= process.env.APP_HOST || 'localhost'
  let appPort=8888
  let appId='syn'
  let electronCtx = false
  let devCtx = true

  const HREF_PORT = window.location.port
  // No HREF PORT when run by Electron
  // Use different values when in electron
  if (HREF_PORT === "") {
    electronCtx = true
    devCtx = false
    let searchParams = new URLSearchParams(window.location.search);
    appPort = searchParams.get("APP");
    toggle()
  }
  async function toggle() {
    if (!$connection) {
      $connection = new Connection(appHost, appPort, appId)
      await $connection.open({title:'', body:''}, applyDeltaFn)

      session = $connection.syn.session

      console.log('joining session...')
      await $connection.joinSession()
      sessions = $connection.sessions
    }
    else {
      $connection.syn.clearState()
      sessions = undefined
      console.log('disconnected')
    }
  }

  async function commitChange() {
    $session.commitChange()
  }

  $: noscribe = $scribeStr === ''
</script>
<style>
  :global(.noscribe) {
  pointer-events: none;
  position: relative;
  }

  :global(.noscribe:after) {
  content: ' ';
  z-index: 20;
  display: block;
  position: absolute;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.7);
  }
  input {
    width: 4em;
    //border: 2px solid red;
    border-radius: 4px;
  }
  .session {
    border-radius: 4px;
    background-color: pink
  }
  button {
    cursor: pointer;
  }
</style>
<button class:noscribe on:click={commitChange}>Commit</button>

{#if devCtx}
<div>
  <h4>Holochain Connection:</h4>
  Host: <input bind:value={appHost}>
  Port: <input bind:value={appPort}>
  AppId: <input bind:value={appId}>
  <button on:click={toggle}>
    {#if $connection}
      Disconnect
    {:else}
      Connect
    {/if}
  </button>
</div>
{/if}

<div class='sessions'>
  Sessions:
  {#if sessions}
  {#each sessions as session}
    <span class='session'>
      Id: {bufferToBase64(session).slice(-4)}
    </span>
  {/each}
  {/if}
</div>
