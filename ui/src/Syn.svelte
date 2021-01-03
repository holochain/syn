<script >
  import { nextIndex, requestedChanges, recordedChanges, committedChanges, connection, scribeStr, content, folks} from './stores.js';
  import { createEventDispatcher } from 'svelte';
  import {decodeJson, encodeJson} from './json.js'

  // this properties are the app-defined functions to apply and undo changes
  export let applyDeltaFn;
  export let undoFn;

  export let session
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

  let requestChecker = window.setInterval(() => {
    if ($requestedChanges.length > 0) {
      if ((Date.now() - $requestedChanges[0].at) > reqTimeout) {
        // for now let's just do the most drastic thing!
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
        }
      }
    }
  }, reqTimeout/2)
  // called when requesting a change to the content as a result of user action
  // If we are the scribe, no need to go into the zome
  export function requestChange(deltas) {

    // any requested made by the scribe should be recorded immediately
    if (session.scribeStr == $connection.me) {
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

  async function synSendChangeReq(index, deltas) {
    deltas = deltas.map(d=>JSON.stringify(d))
    return callZome('send_change_request', {scribe: session.scribe, change: [index, deltas]});
  }

  async function synSendHeartbeat(participants, data) {
    data = encodeJson(data)
    return callZome("send_heartbeat", {participants, data})
  }

  async function synSendChange(index, deltas) {
    const participants = Object.values($folks).map(v=>v.pubKey)
    if (participants.length > 0) {
      console.log(`Sending change for ${index} to ${folksPretty}:`, deltas);
      deltas = deltas.map(d=>JSON.stringify(d))
      return callZome("send_change", {participants, change: [index, deltas]})
    }
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

  const dispatch = createEventDispatcher();

  let commitInProgress = false;
  let currentCommitHeaderHash;
  $: currentCommitHeaderHashStr = arrayBufferToBase64(currentCommitHeaderHash)
  let lastCommitedContentHash;

  $: lastCommitedContentHashStr = arrayBufferToBase64(lastCommitedContentHash)
  $: folksPretty =  JSON.stringify(Object.keys($folks))

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


  import {AdminWebsocket, AppWebsocket} from '@holochain/conductor-api'
  let adminPort=1234;
  let appPort=8888;
  async function toggle() {
    if (!$connection) {
      $connection = {}
      const appClient = await AppWebsocket.connect(
        `ws://localhost:${appPort}`,
        signal => {
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
          case "ChangeReq": {
            let [index, deltas] = signal.data.payload.signal_payload
            deltas = deltas.map(d=>JSON.parse(d))
            changeReq([index, deltas]);
            break;
          }
          case "Change": {
            let [index, deltas] = signal.data.payload.signal_payload
            deltas = deltas.map(d=>JSON.parse(d))
            change(index, deltas);
            break;
          }
          case "Heartbeat":
            let data = decodeJson(signal.data.payload.signal_payload)
            heartbeat(data)
          }
        }
      );
      console.log("connected", appClient)
      const appInfo = await appClient.appInfo({ installed_app_id: "syn" });
      const cellId = appInfo.cell_data[0][0];
      const agentPubKey = cellId[1];
      const me = arrayBufferToBase64(agentPubKey);
      const myTag = me.slice(-4);
      $connection = {
        appClient,
        appInfo,
        cellId,
        agentPubKey,
        me,
        myTag,
      }
      console.log("active", $connection);
      session = await callZome("join_session");
      session.deltas = session.deltas.map(d => JSON.parse(d))
      session.snapshotHash = await synHashContent(session.snapshot_content);
      session.snapshotHashStr = arrayBufferToBase64(session.snapshotHash);
      session.scribeStr = arrayBufferToBase64(session.scribe);
      $scribeStr = session.scribeStr
      console.log("joined", session);
      const newContent = {... session.snapshot_content}; // clone so as not to pass by ref
      newContent.meta = {}
      newContent.meta[myTag] = 0
      setStateFromSession({
        content: newContent,
        contentHash: session.content_hash,
        deltas: session.deltas,
      });
    } else {
      $scribeStr = ""
      $connection = undefined
    }
  }

  // handler for the heartbeat event
  function heartbeat(data) {
    console.log("got heartbeat", data)
    if (session.scribeStr == $connection.me) {
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
    if (session.scribeStr == $connection.me) {
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
      $nextIndex += 1
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
      $nextIndex += 1
    }
  }

  // handler for the change event
  function change(index, deltas) {
    if (session.scribeStr == $connection.me) {
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
    if (session.scribeStr == $connection.me) {
      updateParticipant(from, request.meta)
      let state = {
        snapshot: session.snapshotHash,
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
      synSendHeartbeat(Object.values($folks).map(v=>v.pubKey), data);
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
    if (session.scribeStr == $connection.me) {
      if ($recordedChanges.length == 0) {
        alert("No changes to commit!");
        return;
      }
      commitInProgress = true
      const newContentHash = await synHashContent($content);
      console.log("commiting from snapshot", session.snapshotHashStr);
      console.log("  prev_hash:", arrayBufferToBase64(lastCommitedContentHash));
      console.log("   new_hash:", arrayBufferToBase64(newContentHash));
      const commit = {
        snapshot: session.snapshotHash,
        change: {
          deltas: $recordedChanges.map(c=>JSON.stringify(c.delta)),
          content_hash: newContentHash,
          previous_change: lastCommitedContentHash,
          meta: {
            contributors: [],
            witnesses: [],
            app_specific: null
          }
        }
      }
      try {
        currentCommitHeaderHash = await callZome('commit', commit)
        lastCommitedContentHash = newContentHash;
        committedChanges.update(c => c.concat($recordedChanges))
        $recordedChanges = []
        $nextIndex = 0
      }
      catch (e) {
      }
      commitInProgress = false
    } else {
      alert("You ain't the scribe!")
    }
  }

  function setStateFromSession(sessionData) {
    $content = sessionData.content;
    lastCommitedContentHash = sessionData.contentHash;
    _recordDeltas(sessionData.deltas);
    committedChanges.update(c => c.concat($recordedChanges))
    $recordedChanges = []
    $nextIndex = 0
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
  z-index: 10;
  display: block;
  position: absolute;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.7);
  }
</style>
<button class:noscribe on:click={commitChange}>Commit</button>

<div>
  <h4>Holochain Connection:</h4>
  App Port: <input bind:value={appPort}>
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
  <h4>Dev data:</h4>
  <ul>
    <li>lastCommitedContentHash: {lastCommitedContentHashStr}
    <li>nextIndex: {$nextIndex}
    <li>folks: {folksPretty}
    <li>content.title: {$content.title}
    <li>scribe: {$scribeStr}
    <li>requested: {JSON.stringify($requestedChanges)}
    <li>recorded count: {$recordedChanges.length}
    <li>committed: {JSON.stringify($committedChanges)}
  </ul>
</div>
