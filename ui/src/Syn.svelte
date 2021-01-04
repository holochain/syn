<script >
  import { session, nextIndex, requestedChanges, recordedChanges, committedChanges, connection, scribeStr, content, folks} from './stores.js';
  import { createEventDispatcher } from 'svelte';
  import {decodeJson, encodeJson} from './json.js'

  // this properties are the app-defined functions to apply and undo changes
  export let applyDeltaFn;
  export let undoFn;

  // this is the list of sessions returned by the DNA
  let sessions;

  export const arrayBufferToBase64 = buffer => {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  let reqCounter = 0
  let reqTimeout = 1000

  let requestChecker = window.setInterval(async () => {
    if ($requestedChanges.length > 0) {
      if ((Date.now() - $requestedChanges[0].at) > reqTimeout) {
        // for now let's just do the most drastic thing!
        /*
        console.log("requested change timed out! Undoing all changes", $requestedChanges[0])
        // TODO: make sure this is transactional and no requestChanges squeek in !
        while ($requestedChanges.length > 0) {
          requestedChanges.update(changes => {
            const change = changes.pop()
            console.log("undoing ",change)
            const undoDelta = undoFn(change);
            console.log("undoDelta: ", undoDelta)
            applyDeltaFn(undoDelta)
            return changes
          })
          }*/
        $requestedChanges = []
        $recordedChanges = []
        // and send a sync request incase something just got out of sequence
        // TODO: prepare for shifting to new scribe if they went offline
        setupSession(await synGetSession($session.session))
        synSendSyncReq()
      }
    }
  }, reqTimeout/2)
  // called when requesting a change to the content as a result of user action
  // If we are the scribe, no need to go into the zome
  export function requestChange(deltas) {

    // any requested made by the scribe should be recorded immediately
    if ($session.scribeStr == $connection.me) {
      const index = $nextIndex
      _recordDeltas(deltas);
      synSendChange(index,deltas);
    } else {
      // otherwise apply the change and queue it to requested changes for
      // confirmation later and send request change to scribe

      // create a unique id for each change
      // TODO: this should be part of actual changeReqs
      const changeId = $connection.myTag+"."+reqCounter;
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

      synSendChangeReq(index, deltas);
      reqCounter+= 1
    }
  }

  // -------------------------------------------------------------------------------------
  // Syn functions are wrappers of the zome calls
  // TODO: refactor to separate library file, requires thinking through if state info should be
  //       passed in as parameters, or if it should actually be a class that holds this state
  async function synSendChangeReq(index, deltas) {
    deltas = deltas.map(d=>JSON.stringify(d))
    return callZome('send_change_request', {scribe: $session.scribe, change: [index, deltas]});
  }

  async function synSendHeartbeat(participants, data) {
    data = encodeJson(data)
    return callZome("send_heartbeat", {participants, data})
  }

  function particpantsForScribeSignals() {
    return Object.values($folks).map(v=>v.pubKey)
  }

  async function synSendChange(index, deltas) {
    const participants = particpantsForScribeSignals()
    if (participants.length > 0) {
      console.log(`Sending change for ${index} to ${folksPretty}:`, deltas);
      deltas = deltas.map(d=>JSON.stringify(d))
      return callZome("send_change", {participants, change: [index, deltas]})
    }
  }

  async function synSendSyncReq() {
    return callZome('send_sync_request', {scribe: $session.scribe});
  }

  async function synGetSessions() {
    return callZome('get_sessions');
  }

  async function synNewSession(content) {
    return callZome('new_session', {content})
  }

  async function synGetSession(session_hash) {
    return callZome('get_session', session_hash)
  }

  async function synSendSyncResp(to, state) {
    state.deltas = state.deltas.map(d=>JSON.stringify(d))
    return callZome("send_sync_response", {
      participant: to,
      state
    })
  }

  async function synHashContent(content) {
    return callZome('hash_content', content)
  }

  async function callZome(fn_name, payload, timeout) {
    if (!$connection) {
      console.log("callZome called when disconnected from conductor");
      return;
    }
    try {
      const zome_name = "syn";
      console.log(`Making zome call ${fn_name} with:`, payload)
      const result = await $connection.appClient.callZome(
        {
          cap: null,
          cell_id: $connection.cellId,
          zome_name,
          fn_name,
          provenance: $connection.agentPubKey,
          payload
        },
        timeout
      );
      return result;
    } catch (error) {
      console.log("ERROR: callZome threw error", error);
      throw(error);
      //  if (error == "Error: Socket is not open") {
      // TODO        return doResetConnection(dispatch);
      // }
    }
  };
/*  if (commitInProgress) {
    //FIXME collect them up anyways and apply later?
    alert("WHOA attempt to apply deltas while commit in progress")
    return;
  }*/
  // -----------------------------------------------------------------------

  const dispatch = createEventDispatcher();

  let commitInProgress = false;
  let currentCommitHeaderHash;
  $: currentCommitHeaderHashStr = arrayBufferToBase64(currentCommitHeaderHash)
  let lastCommitedContentHash;

  $: lastCommitedContentHashStr = arrayBufferToBase64(lastCommitedContentHash)
  $: folksPretty =  JSON.stringify(Object.keys($folks).map(f => f.slice(-4)))

  function addChangeAsScribe(change) {
    let [index, deltas] = change;

    if ($nextIndex != index) {
      console.log("Scribe is receiving change out of order!")
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

    recordDeltas(index, deltas);

    // notify all participants of the change
    synSendChange(index, deltas)
  }

  function holochainSignalHandler(signal) {
    // ignore signals not meant for me
    if (arrayBufferToBase64(signal.data.cellId[1]) != $connection.me) {
      return;
    }
    console.log("Got Signal", signal.data.payload.signal_name, signal)
    switch (signal.data.payload.signal_name) {
    case "SyncReq":
      syncReq({from: signal.data.payload.signal_payload});
      break;
    case "SyncResp":
      const state = signal.data.payload.signal_payload;
      state.deltas = state.deltas.map(d=>JSON.parse(d))
      console.log("post",state)
      syncResp(state);
      break;
    case "ChangeReq":
      {
        let [index, deltas] = signal.data.payload.signal_payload
        deltas = deltas.map(d=>JSON.parse(d))
        changeReq([index, deltas]);
        break;
      }
    case "Change":
      {
        let [index, deltas] = signal.data.payload.signal_payload
        deltas = deltas.map(d=>JSON.parse(d))
        change(index, deltas);
        break;
      }
    case "Heartbeat":
      let data = decodeJson(signal.data.payload.signal_payload)
      heartbeat(data)
      break;
    case "CommitNotice":
      commitNotice(signal.data.payload.signal_payload)
    }
  }

  function commitNotice(commitInfo) {
    // make sure we are at the right place to be able to just move forward with the commit
    if (lastCommitedContentHashStr == arrayBufferToBase64(commitInfo.previous_content_hash) &&
        $nextIndex == commitInfo.deltas_committed) {
      lastCommitedContentHashStr = arrayBufferToBase64(commitInfo.commit_content_hash)
      committedChanges.update(c => c.concat($recordedChanges))
      $recordedChanges = []
    } else {
      console.log("received commit notice for beyond our last commit, gotta resync");
      console.log("commit.commit_content_hash:", arrayBufferToBase64(commitInfo.commit_content_hash))
      console.log("commit.previous_content_hash:", arrayBufferToBase64(commitInfo.previous_content_hash))
      console.log("commit.deltas_committed:", commitInfo.deltas_committed)
      console.log("my lastCommitedContentHashStr", lastCommitedContentHashStr)
      console.log("my nextIndex", $nextIndex)
      // TODO resync
    }

  }

  async function setupConnection(appClient) {
    $connection = {appClient}
    const appInfo = await appClient.appInfo({ installed_app_id: appId });
    const cellId = appInfo.cell_data[0][0];
    const agentPubKey = cellId[1];
    const me = arrayBufferToBase64(agentPubKey);
    const myTag = me.slice(-4);
    const Dna = arrayBufferToBase64(cellId[0]);
    $connection = {
      appClient,
      appInfo,
      cellId,
      agentPubKey,
      me,
      myTag,
      Dna
    }
    console.log("connection active:", $connection);
  }

  function setupSession(sessionInfo) {
    $session = sessionInfo
    $session.deltas = $session.deltas.map(d => JSON.parse(d))
    $session.snapshotHashStr = arrayBufferToBase64($session.snapshot_hash);
    $session.scribeStr = arrayBufferToBase64($session.scribe);
    $scribeStr = $session.scribeStr
    console.log("session joined:", $session);
    const newContent = {... $session.snapshot_content}; // clone so as not to pass by ref
    newContent.meta = {}
    newContent.meta[$connection.myTag] = 0

    $content = newContent
    lastCommitedContentHash = $session.content_hash
    $recordedChanges = []
    // use the _recordDeltas function to get the undable changes loaded into the history
    // and then move these items into the committed changes
    _recordDeltas($session.deltas);
    committedChanges.update(c => c.concat($recordedChanges))
    $recordedChanges = []
  }

  async function joinSession() {
    if (sessions.length == 0) {
      setupSession(await synNewSession({title:"", body:""}))
    } else {
      setupSession(await synGetSession(sessions[0]))
      await synSendSyncReq()
    }
  }

  function clearState() {
    $scribeStr = ""
    $connection = undefined
    $folks = {}
    $content = {title:"", body:""}
    $requestedChanges = []
    $recordedChanges = []
    $committedChanges = []
    $session = undefined
  }

  import {AdminWebsocket, AppWebsocket} from '@holochain/conductor-api'
  let adminPort=1234;
  let appPort=8888;
  let appId="syn"
  async function toggle() {
    if (!$connection) {
      const appClient = await AppWebsocket.connect(
        `ws://localhost:${appPort}`,
        holochainSignalHandler
      );
      console.log("connected", appClient)
      await setupConnection(appClient)
      sessions = await synGetSessions()
      console.log("joining session...")
      await joinSession()
    }
    else {
      console.log("disconnected")
      clearState()
    }
  }

  // handler for the heartbeat event
  function heartbeat(data) {
    console.log("got heartbeat", data)
    if ($session.scribeStr == $connection.me) {
    }
    else {
      if (data.participants) {
        Object.values(data.participants).forEach(
          p => {
            console.log("p", p)
            updateParticipant(p.pubKey, p.meta)
          }
        );
      }
    }
  }

  // handler for the changeReq event
  function changeReq(change) {
    if ($session.scribeStr == $connection.me) {
      addChangeAsScribe(change)
    } else {
      console.log("change requested but I'm not the scribe.")
    }
  }

  function _recordDelta(delta) {
    // apply the deltas to the content which returns the undoable change
    const undoableChange = applyDeltaFn(delta)
    // append changes to the recorded history
    recordedChanges.update(h=>[...h, undoableChange])
  }

  function _recordDeltas(deltas) {
    // apply the deltas to the content which returns the undoable change
    for (const delta of deltas) {
      _recordDelta(delta)
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
            recordedChanges.update(c => [...c, change]);
            return h
          })
        } else {
          // TODO rebaise?
          console.log("REBASE NEEDED?")
          console.log("requeted ", $requestedChanges[0].delta)
          console.log("to be recorded ", delta)
        }
      } else {
        // no requested changes so this must be from someone else so we don't have
        // to check our requested changes
        // TODO: do we need to check if this is a change that we did send and have already
        // integrated somehow and ignore if so.  (Seems unlikely?)
        _recordDelta(delta)
      }
    }
  }

  // handler for the change event
  function change(index, deltas) {
    if ($session.scribeStr == $connection.me) {
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

  function updateParticipant(pubKey, meta) {
    const pubKeyStr = arrayBufferToBase64(pubKey);
    if (!(pubKeyStr in $folks) && (pubKeyStr != $connection.me)) {
      $folks[pubKeyStr] = {pubKey, meta}
      $folks = $folks
    } else if (meta) {
      $folks[pubKeyStr].meta = meta
      $folks = $folks
    }
  }

  // handler for the syncReq event
  function syncReq(request) {
    const from = request.from
    if ($session.scribeStr == $connection.me) {
      updateParticipant(from, request.meta)
      let state = {
        snapshot: $session.snapshot_hash,
        commit_content_hash: lastCommitedContentHash,
        deltas: $recordedChanges.map(c => c.delta)
      };
      if (currentCommitHeaderHash) {
        state["commit"] = currentCommitHeaderHash;
      }
      // send a sync response to the sender
      synSendSyncResp(from, state);
      // and send everybody a heartbeat with new participants
      const p = {...$folks}
      p[$connection.me] = {
        pubKey: $connection.agentPubKey
      }
      const data = {
        participants: p
      }
      synSendHeartbeat(particpantsForScribeSignals(), data);
    }
    else {
      console.log("syncReq received but I'm not the scribe!")
    }
  }

  // handler for the syncResp event
  function syncResp(stateForSync) {
    // Make sure that we are working off the same snapshot and commit
    const commitContentHashStr = arrayBufferToBase64(stateForSync.commit_content_hash)
    if (commitContentHashStr == lastCommitedContentHashStr) {
      _recordDeltas(stateForSync.deltas);
    } else {
      console.log("WHOA, sync response has different current state assumptions")
      // TODO: resync somehow
    }
  }

  async function commitChange() {
    if ($session.scribeStr == $connection.me) {
      if ($recordedChanges.length == 0) {
        alert("No changes to commit!");
        return;
      }
      commitInProgress = true
      const newContentHash = await synHashContent($content);
      console.log("commiting from snapshot", $session.snapshotHashStr);
      console.log("  prev_hash:", arrayBufferToBase64(lastCommitedContentHash));
      console.log("   new_hash:", arrayBufferToBase64(newContentHash));
      const commit = {
        snapshot: $session.snapshot_hash,
        change: {
          deltas: $recordedChanges.map(c=>JSON.stringify(c.delta)),
          content_hash: newContentHash,
          previous_change: lastCommitedContentHash,
          meta: {
            contributors: [],
            witnesses: [],
            app_specific: null
          }
        },
        participants: particpantsForScribeSignals()
      }
      try {
        currentCommitHeaderHash = await callZome('commit', commit)
        lastCommitedContentHash = newContentHash;
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

  $: noscribe = $scribeStr === ""
</script>
<style>
  :global(.noscribe) {
  pointer-events: none;
  position: relative;
  }

  :global(.noscribe:after) {
  content: " ";
  z-index: 0;
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


<hr/>
<div>
  <h4>Syn data:</h4>
  <ul>
    <li>lastCommitedContentHash: {lastCommitedContentHashStr}
    <li>sessions: {JSON.stringify(sessions ? sessions.map(s=>arrayBufferToBase64(s).slice(-4)) : undefined)}
  </ul>
</div>
