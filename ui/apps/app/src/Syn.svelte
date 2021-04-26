<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import { join_session, request_change_b, scribe_str_b } from '@syn-ui/model'
  import { connection_b } from '@syn-ui/zome-client'
  import { bufferToBase64 } from '@syn-ui/utils'
  const ctx = getContext('ctx')
  const connection = connection_b(ctx)
  const scribe_str = scribe_str_b(ctx)

  const request_change = request_change_b(ctx)
  const session = session_b(ctx)

  // this properties are the app-defined functions to apply and undo changes
  export let apply_delta_fn, undoFn

  // this is the list of sessions returned by the DNA
  let sessions

  // -----------------------------------------------------------------------

  const dispatch = createEventDispatcher()

  let adminPort=1234
  let app_port=8888
  let app_id='syn'
  async function toggle() {
    if (!$session) {
    // if (!$connection) {
      $session = await join_session({ app_port, app_id, apply_delta_fn, ctx })
      // $connection = new Connection(ctx, app_port, app_id)
      // await $connection.open({title:'', body:''}, apply_delta_fn)
      //
      // session = $connection.syn.session
      //
      // console.log('joining session...')
      // await $connection.joinSession()
      sessions = $connection.sessions
    }
    else {
      $connection.syn.clearState()
      sessions = undefined
      console.log('disconnected')
    }
  }

  async function commit_change() {
    $session.commit_change()
  }

  $: noscribe = $scribe_str === ''
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
<button class:noscribe on:click={commit_change}>Commit</button>

<div>
  <h4>Holochain Connection:</h4>
  App Port: <input bind:value={app_port}>
  AppId: <input bind:value={app_id}>
  <button on:click={toggle}>
    {#if $connection}
      Disconnect
    {:else}
      Connect
    {/if}
  </button>
</div>

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
