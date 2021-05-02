<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import {
      commit_change_b, session_info_scribe_str_b, session_info_b, sessions_b, toggle_session
  } from '@syn-ui/model'
  import { bufferToBase64 } from '@syn-ui/utils'
  const ctx = getContext('ctx')
  const session_info = session_info_b(ctx)
  // this is the list of sessions returned by the DNA
  const sessions = sessions_b(ctx)
  const session_info_scribe_str = session_info_scribe_str_b(ctx)
  const commit_change = commit_change_b(ctx)

  // this properties are the app-defined functions to apply and undo changes
  export let undoFn

  // -----------------------------------------------------------------------

  const dispatch = createEventDispatcher()

  let adminPort = 1234
  let app_port = 8888
  let app_id = 'syn'
  async function toggle() {
      await toggle_session({ app_port, app_id, ctx })
      if (!$session_info) {
          console.log('disconnected')
      }
  }

  $: noscribe = $session_info_scribe_str === ''
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
<button class:noscribe on:click={evt=>commit_change()}>Commit</button>

<div>
  <h4>Holochain Connection:</h4>
  App Port: <input bind:value={app_port}>
  AppId: <input bind:value={app_id}>
  <button on:click={toggle}>
    {#if $session_info}
      Disconnect
    {:else}
      Connect
    {/if}
  </button>
</div>

<div class='sessions'>
  Sessions:
  {#each $sessions || [] as session}
    <span class='session'>
      Id: {bufferToBase64(session).slice(-4)}
    </span>
  {/each}
</div>
