<script>
  import { connection, scribeStr, content, folks } from './stores.js'
  import { createEventDispatcher, onMount } from 'svelte'
  import { Connection} from './syn.js'
  import { bufferToBase64, emptySession } from './utils.js'

  let session

  // this properties are the app-defined functions to apply and undo changes
  export let applyDeltaFn
  export let undoFn

  export let setAgentPubkey
  let contentChanged

  // this is the list of sessions returned by the DNA
  let sessions

  export function requestChange(deltas) {
    console.log('REQUEST CHANGE!')
    contentChanged = true
    $session.requestChange(deltas)
  }

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const appPort = urlParams.has('port') ? urlParams.get('port') : 8888
    const appId = urlParams.has('id') ? urlParams.get('id') : 'syn'

    console.log('Connecting with', appPort, appId)

    $connection = new Connection('localhost', appPort, appId)
    await $connection.open({ ...emptySession }, applyDeltaFn)

    setAgentPubkey(bufferToBase64($connection.getAgentPubkey()))

    session = $connection.syn.session

    console.log('joining session...')
    await $connection.joinSession()
    sessions = $connection.sessions


    setInterval(() => {
      console.log('firing interval', $session.amScribe, $session.isDirty)
      console.log('amScribe', $session.amScribe(), $session.isDirty)

      if ($session.amScribe() && $session.isDirty) {
        console.log('committing change')
        commitChange()
        $session.isDirty = false
      }
    }, 15 * 1000)

  })

  // -----------------------------------------------------------------------

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
<div>
  {#if contentChanged}
    FRESH CHANGES!
  {:else }
    ALL RECORDED!
  {/if}
  </div>

