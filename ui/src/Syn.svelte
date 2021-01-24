<script>
  import { nextIndex, requestedChanges, recordedChanges, committedChanges, connection, scribeStr, content, folks } from './stores.js'
  import { createEventDispatcher } from 'svelte'
  import {decodeJson, encodeJson} from './json.js'
  import { getFolkColors } from './colors.js'
  import { Syn, Connection, Session, arrayBufferToBase64} from './syn.js'

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
        let gone = updateRecentlyTimedOutFolks()
        if (gone.length > 0) {
          $connection.syn.sendFolkLore($session.folksForScribeSignals(), {gone})
          // Scribe's heartbeat nudges the folks store so svelte detects an update
          $folks = $folks
        }
      } else {
        // I'm not the scribe so send them a heartbeat
        await $connection.syn.sendHeartbeat('Hello')
      }
    }
  }, heartbeatInterval)

  let reqCounter = 0
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
        $connection.syn.sendSyncReq()
      }
    }
  }, reqTimeout/2)

  // called when requesting a change to the content as a result of user action
  // If we are the scribe, no need to go into the zome
  export function requestChange(deltas) {
    // any requested made by the scribe should be recorded immediately
    if ($scribeStr == $connection.syn.me) {
      const index = $nextIndex
      $session._recordDeltas(deltas)
      $session.sendChange(index,deltas)
    } else {
      // otherwise apply the change and queue it to requested changes for
      // confirmation later and send request change to scribe

      // create a unique id for each change
      // TODO: this should be part of actual changeReqs
      const changeId = $connection.syn.myTag+'.'+reqCounter
      const changeAt = Date.now()

      // we want to apply this to current nextIndex plus any previously
      // requested changes that haven't yet be recorded
      const index = $nextIndex + $requestedChanges.length

      for (const delta of deltas) {
        const undoableChange = applyDeltaFn(delta)
        undoableChange.id = changeId
        undoableChange.at = changeAt
        // append changes to the requested queue
        requestedChanges.update(h=>[...h, undoableChange])
      }

      $connection.syn.sendChangeReq(index, deltas)
      reqCounter+= 1
    }
  }

  // -------------------------------------------------------------------------------------
  // Syn functions are wrappers of the zome calls
  // TODO: refactor to separate library file, requires thinking through if state info should be
  //       passed in as parameters, or if it should actually be a class that holds this state

  // const outOfSessionTimout = 30 * 1000
  const outOfSessionTimout = 8 * 1000 // testing code :)

  // updates folks in-session status by checking their last-seen time
  function updateRecentlyTimedOutFolks() {
    let result = []
    for (const [pubKeyStr, folk] of Object.entries($folks)) {
      if (folk.inSession && (Date.now() - $folks[pubKeyStr].lastSeen > outOfSessionTimout)) {
        folk.inSession = false
        result.push($folks[pubKeyStr].pubKey)
      }
    }
    return result
  }

  async function callZome(fn_name, payload, timeout) {
    if (!$connection || !$connection.syn) {
      console.log('callZome called when disconnected from conductor')
      return
    }
    try {
      const zome_name = 'syn'
      console.log(`Making zome call ${fn_name} with:`, payload)
      const result = await $connection.appClient.callZome(
        {
          cap: null,
          cell_id: $connection.syn.cellId,
          zome_name,
          fn_name,
          provenance: $connection.syn.agentPubKey,
          payload
        },
        timeout
      )
      return result
    } catch (error) {
      console.log('ERROR: callZome threw error', error)
      throw(error)
      //  if (error == 'Error: Socket is not open') {
      // TODO        return doResetConnection(dispatch)
      // }
    }
  }
/*  if (commitInProgress) {
    //FIXME collect them up anyways and apply later?
    alert('WHOA attempt to apply deltas while commit in progress')
    return
  }*/
  // -----------------------------------------------------------------------

  const dispatch = createEventDispatcher()

  let commitInProgress = false
  let currentCommitHeaderHash
  $: currentCommitHeaderHashStr = arrayBufferToBase64(currentCommitHeaderHash)

  $: folksPretty =  JSON.stringify(Object.keys($folks).map(f => f.slice(-4)))

  function addChangeAsScribe(change) {
    let [index, deltas] = change

    if ($nextIndex != index) {
      console.log('Scribe is receiving change out of order!')
      console.log(`nextIndex: ${$nextIndex}, changeIndex:${index} for deltas:`, deltas)

      if (index < $nextIndex) {
        // change is too late, nextIndex has moved on
        // TODO: rebase? notify sender?
        return
      } else {
        // change is in the future, possibly some other change was dropped or is slow in arriving
        // TODO: wait a bit?  Ask sender for other changes?
        return
      }
    }

    recordDeltas(index, deltas)

    // notify all participants of the change
    $session.sendChange(index, deltas)
  }

  function holochainSignalHandler(signal) {
    // ignore signals not meant for me
    if (!$connection || arrayBufferToBase64(signal.data.cellId[1]) != $connection.syn.me) {
      return
    }
    console.log('Got Signal', signal.data.payload.signal_name, signal)
    switch (signal.data.payload.signal_name) {
    case 'SyncReq':
      syncReq({from: signal.data.payload.signal_payload})
      break
    case 'SyncResp':
      const state = signal.data.payload.signal_payload
      state.deltas = state.deltas.map(d=>JSON.parse(d))
      console.log('post',state)
      syncResp(state)
      break
    case 'ChangeReq':
      {
        let [index, deltas] = signal.data.payload.signal_payload
        deltas = deltas.map(d=>JSON.parse(d))
        changeReq([index, deltas])
        break
      }
    case 'Change':
      {
        let [index, deltas] = signal.data.payload.signal_payload
        deltas = deltas.map(d=>JSON.parse(d))
        change(index, deltas)
        break
      }
    case 'FolkLore':
      {
        let data = decodeJson(signal.data.payload.signal_payload)
        folklore(data)
        break
      }
    case 'Heartbeat':
      {
        let [from, jsonData] = signal.data.payload.signal_payload
        const data = decodeJson(jsonData)
        heartbeat(from, data)
        break
      }
    case 'CommitNotice':
      commitNotice(signal.data.payload.signal_payload)
    }
  }

  function commitNotice(commitInfo) {
    // make sure we are at the right place to be able to just move forward with the commit
    if ($session.contentHashStr == arrayBufferToBase64(commitInfo.previous_content_hash) &&
        $nextIndex == commitInfo.deltas_committed) {
      $session.contentHashStr = arrayBufferToBase64(commitInfo.commit_content_hash)
      committedChanges.update(c => c.concat($recordedChanges))
      $recordedChanges = []
    } else {
      console.log('received commit notice for beyond our last commit, gotta resync')
      console.log('commit.commit_content_hash:', arrayBufferToBase64(commitInfo.commit_content_hash))
      console.log('commit.previous_content_hash:', arrayBufferToBase64(commitInfo.previous_content_hash))
      console.log('commit.deltas_committed:', commitInfo.deltas_committed)
      console.log('my $session.contentHashStr', $session.contentHashStr)
      console.log('my nextIndex', $nextIndex)
      // TODO resync
    }

  }

  async function joinSession() {
    if (sessions.length == 0) {
      sessions[0] = await $connection.syn.newSession()
    } else {
      $connection.syn.setSession(await $connection.syn.getSession(sessions[0]), applyDeltaFn)
      await $connection.syn.sendSyncReq()
    }
  }

  let adminPort=1234
  let appPort=8888
  let appId='syn'
  const defaultContent = {title:'', body:''}
  async function toggle() {
    if (!$connection) {
      $connection = new Connection(appPort, appId, holochainSignalHandler)
      await $connection.open(defaultContent, applyDeltaFn)

      sessions = await $connection.syn.getSessions()
      session = $connection.syn.session

      console.log('joining session...')
      await joinSession()
    }
    else {
      $connection.syn.clearState(defaultContent)
      console.log('disconnected')
    }
  }

  // handler for the heartbeat event
  function heartbeat(from, data) {
    console.log('got heartbeat', data, 'from:', from)
    if ($scribeStr != $connection.syn.me) {
      console.log("heartbeat received but I'm not the scribe.")
    }
    else {
      // I am the scribe and I've recieved a heartbeat from a concerned Folk
      $connection.syn.updateFolkLastSeen(from)
    }
  }

  function folklore(data) {
    console.log('got folklore', data)
    if ($scribeStr == $connection.syn.me) {
      console.log("folklore received but I'm the scribe!")
    }
    else {
      if (data.gone) {
        Object.values(data.participants).forEach(
          pubKey => {
            $connection.syn.updateFolkLastSeen(pubKey, true)
          }
        )
      }
      if (data.participants) {
        Object.values(data.participants).forEach(
          p => {
            console.log('p', p)
            $connection.syn.updateParticipant(p.pubKey, p.meta)
          }
        )
      }
    }
  }

  // handler for the changeReq event
  function changeReq(change) {
    if ($scribeStr == $connection.syn.me) {
      addChangeAsScribe(change)
    } else {
      console.log("change requested but I'm not the scribe.")
    }
  }

  // apply changes confirmed as recorded by the scribe while reconciling
  // and possibly rebasing our requested changes
  function recordDeltas(index, deltas) {
    for (const delta of deltas) {
      if ($requestedChanges.length > 0) {
        // if this change is our next requested change then remove it
        if (JSON.stringify(delta) == JSON.stringify($requestedChanges[0].delta)) {
          requestedChanges.update(h=>{
            const change = h.shift()
            //delete(change.id) // clean out the id for the history
            recordedChanges.update(c => [...c, change])
            return h
          })
        } else {
          // TODO rebase?
          console.log('REBASE NEEDED?')
          console.log('requeted ', $requestedChanges[0].delta)
          console.log('to be recorded ', delta)
        }
      } else {
        // no requested changes so this must be from someone else so we don't have
        // to check our requested changes
        // TODO: do we need to check if this is a change that we did send and have already
        // integrated somehow and ignore if so.  (Seems unlikely?)
        $session._recordDelta(delta)
      }
    }
  }

  // handler for the change event
  function change(index, deltas) {
    if ($scribeStr == $connection.syn.me) {
        console.log("change received but I'm the scribe, so I'm ignoring this!")
    } else {
      console.log(`change arrived for ${index}:`, deltas)
      if ($nextIndex == index) {
        recordDeltas(index, deltas)
      } else {
        console.log(`change arrived out of sequence nextIndex: ${$nextIndex}, change index:${index}`)
        // TODO either call for sync, or do some waiting algorithm
      }
    }
  }

  // handler for the syncReq event
  function syncReq(request) {
    const from = request.from
    if ($scribeStr == $connection.syn.me) {
      $connection.syn.updateParticipant(from, request.meta)
      $connection.syn.updateFolkLastSeen(from)
      let state = {
        snapshot: $session.snapshot_hash,
        commit_content_hash: $session.content_hash,
        deltas: $recordedChanges.map(c => c.delta)
      }
      if (currentCommitHeaderHash) {
        state['commit'] = currentCommitHeaderHash
      }
      // send a sync response to the sender
      $connection.syn.sendSyncResp(from, state)
      // and send everybody a folk lore p2p message with new participants
      const p = {...$folks}
      p[$connection.syn.me] = {
        pubKey: $connection.syn.agentPubKey
      }
      const data = {
        participants: p
      }
      $connection.syn.sendFolkLore(Ssession.folksForScribeSignals(), data)
    }
    else {
      console.log("syncReq received but I'm not the scribe!")
    }
  }

  // handler for the syncResp event
  function syncResp(stateForSync) {
    // Make sure that we are working off the same snapshot and commit
    const commitContentHashStr = arrayBufferToBase64(stateForSync.commit_content_hash)
    if (commitContentHashStr == $session.contentHashStr) {
      $session._recordDeltas(stateForSync.deltas)
    } else {
      console.log('WHOA, sync response has different current state assumptions')
      // TODO: resync somehow
    }
  }

  async function commitChange() {
    if ($scribeStr == $connection.syn.me) {
      if ($recordedChanges.length == 0) {
        alert('No changes to commit!')
        return
      }
      commitInProgress = true
      const newContentHash = await $connection.syn.hashContent($content)
      console.log('commiting from snapshot', $session.snapshotHashStr)
      console.log('  prev_hash:', $session.contentHashStr)
      console.log('   new_hash:', arrayBufferToBase64(newContentHash))
      const commit = {
        snapshot: $session.snapshot_hash,
        change: {
          deltas: $recordedChanges.map(c=>JSON.stringify(c.delta)),
          content_hash: newContentHash,
          previous_change: $session.content_hash,
          meta: {
            contributors: [],
            witnesses: [],
            app_specific: null
          }
        },
        participants: $session.folksForScribeSignals()
      }
      try {
        currentCommitHeaderHash = await callZome('commit', commit)
        // if commit successfull we need to update the content hash and its string in the session
        $session.content_hash = newContentHash
        $session.contentHashStr = arrayBufferToBase64($session.content_hash)
        committedChanges.update(c => c.concat($recordedChanges))
        $recordedChanges = []
      }
      catch (e) {
      }
      commitInProgress = false
    } else {
      alert("You ain't the scribe!")
    }
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
