<script>
  import { nextIndex, requestedChanges, recordedChanges, committedChanges, connection, scribeStr, content, folks } from './stores.js'
  import { createEventDispatcher } from 'svelte'
  import {decodeJson, encodeJson} from './json.js'
  import { getFolkColors } from './colors.js'
  import { Syn, Connection, Session, arrayBufferToBase64, FOLK_SEEN} from './syn.js'

  let session

  // this properties are the app-defined functions to apply and undo changes
  export let applyDeltaFn
  export let undoFn

  // this is the list of sessions returned by the DNA
  let sessions

  // let heartbeatInterval = 15 * 1000 // 15 seconds
  let heartbeatInterval = 2  * 1000 // for testing ;)
  // Send heartbeat to scribe every [heartbeat interval]
  let heart = window.setInterval(async () => {
    if ($session) {
      if ($scribeStr == $connection.syn.me) {
        // examine folks last seen time and see if any have crossed the session out-of-session
        // timeout so we can tell everybody else about them having dropped.
        let gone = $session.updateRecentlyTimedOutFolks()
        if (gone.length > 0) {
          $session.sendFolkLore($session.folksForScribeSignals(), {gone})
        }
      } else {
        // I'm not the scribe so send them a heartbeat
        await $session.sendHeartbeat('Hello')
      }
    }
  }, heartbeatInterval)

  let reqTimeout = 1000

  let requestChecker = window.setInterval(async () => {
    if ($requestedChanges.length > 0) {
      if ((Date.now() - $requestedChanges[0].at) > reqTimeout) {
        // for now let's just do the most drastic thing!
        /*
        console.log('requested change timed out! Undoing all changes', $requestedChanges[0])
        // TODO: make sure this is transactional and no requestChanges squeak in !
        while ($requestedChanges.length > 0) {
          requestedChanges.update(changes => {
            const change = changes.pop()
            console.log('undoing ', change)
            const undoDelta = undoFn(change)
            console.log('undoDelta: ', undoDelta)
            applyDeltaFn(undoDelta)
            return changes
          })
          }*/
        $requestedChanges = []
        $recordedChanges = []
        // and send a sync request incase something just got out of sequence
        // TODO: prepare for shifting to new scribe if they went offline
        $connection.syn.setSession(await $connection.syn.getSession($session.session_hash, applyDeltaFn))
        console.log("HERE")
        $connection.syn.sendSyncReq()
      }
    }
  }, reqTimeout/2)

  export function requestChange(deltas) {
    $session.requestChange(deltas)
  }

  // -----------------------------------------------------------------------

  const dispatch = createEventDispatcher()

  let commitInProgress = false
  let currentCommitHeaderHash
  $: currentCommitHeaderHashStr = arrayBufferToBase64(currentCommitHeaderHash)

  $: folksPretty =  JSON.stringify(Object.keys($folks).map(f => f.slice(-4)))

  function holochainSignalHandler(signal) {
    // ignore signals not meant for me
    if (!$connection || arrayBufferToBase64(signal.data.cellId[1]) != $connection.syn.me) {
      return
    }
    console.log('Got Signal', signal.data.payload.signal_name, signal)
    switch (signal.data.payload.signal_name) {
    case 'SyncReq':
      $session.syncReq({from: signal.data.payload.signal_payload})
      break
    case 'SyncResp':
      const state = signal.data.payload.signal_payload
      state.deltas = state.deltas.map(d=>JSON.parse(d))
      $session.syncResp(state)
      break
    case 'ChangeReq':
      {
        let [index, deltas] = signal.data.payload.signal_payload
        deltas = deltas.map(d=>JSON.parse(d))
        $session.changeReq([index, deltas])
        break
      }
    case 'Change':
      {
        let [index, deltas] = signal.data.payload.signal_payload
        deltas = deltas.map(d=>JSON.parse(d))
        $session.change(index, deltas)
        break
      }
    case 'FolkLore':
      {
        let data = decodeJson(signal.data.payload.signal_payload)
        $session.folklore(data)
        break
      }
    case 'Heartbeat':
      {
        let [from, jsonData] = signal.data.payload.signal_payload
        const data = decodeJson(jsonData)
        $session.heartbeat(from, data)
        break
      }
    case 'CommitNotice':
      $session.commitNotice(signal.data.payload.signal_payload)
    }
  }

  async function joinSession() {
    if (sessions.length == 0) {
      sessions[0] = await $connection.syn.newSession()
    } else {
      $connection.syn.setSession(await $connection.syn.getSession(sessions[0]), applyDeltaFn)
      if ($scribeStr != $connection.syn.me) {
        await $connection.syn.sendSyncReq()
     }
    }
  }

  let adminPort=1234
  let appPort=8888
  let appId='syn'
  async function toggle() {
    if (!$connection) {
      $connection = new Connection(appPort, appId, holochainSignalHandler)
      await $connection.open({title:'', body:''}, applyDeltaFn)

      sessions = await $connection.syn.getSessions()
      session = $connection.syn.session

      console.log('joining session...')
      await joinSession()
    }
    else {
      $connection.syn.clearState()
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

<div>
  <h4>Holochain Connection:</h4>
  App Port: <input bind:value={appPort}>
  AppId: <input bind:value={appId}>
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
      Id: {arrayBufferToBase64(session).slice(-4)}
    </span>
  {/each}
  {/if}
</div>
