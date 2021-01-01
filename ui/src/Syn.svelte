<script >
  import { history, connection, scribeStr, content, pendingDeltas, folks} from './stores.js';
  import { createEventDispatcher } from 'svelte';
  import {decodeJson, encodeJson} from './json.js'

  let roundTripForScribe = true
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

  // called when requesting a change to the content as a result of user action
  // If we are the scribe, no need to go into the zome
  export function requestChange(delta) {
    // any requested change is on top of last pending delta
    if (session.scribeStr == $connection.me && !roundTripForScribe) {
      // if I'm the scribe the index is implicit in my pending delta's list
      const index = $pendingDeltas.length;
      addChangeAsScribe([index, delta])
    } else {
      synSendChangeReq(currentIndex, [delta]);
    }
  }

  async function synSendChangeReq(index, deltas) {
//    delta.by = $connection.me
    deltas = deltas.map(d=>JSON.stringify(d))
    return callZome('send_change_request', {scribe: session.scribe, change: [index, deltas]});
  }

  async function synSendHeartbeat(participants, data) {
    data = encodeJson(data)
    return callZome("send_heartbeat", {participants, data})
  }

  async function synSendChange(participants, index, deltas) {
    deltas = deltas.map(d=>JSON.stringify(d))
    return callZome("send_change", {participants, change: [index, deltas]})
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

  // this property is the app-defined function to apply deltas to the content
  export let applyDeltasFn;

  const dispatch = createEventDispatcher();

  let commitInProgress = false;
  let currentIndex = 0; // stores the index of deltas we are at on top of the current commit
  let currentCommitHeaderHash;
  $: currentCommitHeaderHashStr = arrayBufferToBase64(currentCommitHeaderHash)
  let lastCommitedContentHash;    // add delta to the pending deltas and change state

  $: lastCommitedContentHashStr = arrayBufferToBase64(lastCommitedContentHash)
  $: folksPretty =  JSON.stringify(Object.keys($folks))

  function addChangeAsScribe(change) {
    let [index, delta] = change;
    // if we can't apply delta immediately (i.e. index is our current index)
    // we must first merge this delta with any previous ones
    if ($pendingDeltas.length != index) {
      console.log("WHOA, index didn't match pending deltas!")
      // TODO: merge
    }
    // add delta to the pending deltas and change state
    if (!roundTripForScribe) {
      $pendingDeltas = [...$pendingDeltas, delta];
      applyDeltas([delta]);
    }
    // notify all participants of the change
    const p = Object.values($folks).map(v=>v.pubKey)
    if (roundTripForScribe) {
      p.push($connection.agentPubKey)
    }
    if (p.length > 0) {
      console.log(`Sending change to ${folksPretty}:`, delta);
      synSendChange(p, index, [delta])
    }
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
          case "ChangeReq":
            let req = signal.data.payload.signal_payload
            req[1] = JSON.parse(req[1])
            changeReq(req);
            break;
          case "Change":
            let [index, deltas] = signal.data.payload.signal_payload
            deltas = deltas.map(d=>JSON.parse(d))
            change(index, deltas);
            break;
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
      $connection = {
        appClient,
        appInfo,
        cellId,
        agentPubKey,
        me: arrayBufferToBase64(agentPubKey)
      }
      console.log("active", $connection);
      session = await callZome("join_session");
      session.deltas = session.deltas.map(d => JSON.parse(d))
      session.snapshotHash = await synHashContent(session.snapshot_content);
      session.snapshotHashStr = arrayBufferToBase64(session.snapshotHash);
      session.scribeStr = arrayBufferToBase64(session.scribe);
      $scribeStr = session.scribeStr
      console.log("joined", session);
      setStateFromSession({
        content: {... session.snapshot_content}, // clone so as not to pass by ref
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

  function applyDeltas(deltas) {
    currentIndex += deltas.length
    // save these deltas to the history
    $history = [...$history, deltas ]
    // apply the deltas to the content
    applyDeltasFn(deltas)
  }

  // handler for the change event
  function change(index, deltas) {
    if (session.scribeStr == $connection.me) {
      if (roundTripForScribe) {
        pendingDeltas.update(d=>d.concat(deltas));
        applyDeltas(deltas)
      } else {
        console.log("change recevied but I'm the scribe, so I'm ignoring this!")
      }
    } else {
      console.log(`change arrived to be on top of ${index}:`, deltas)
      if (currentIndex == index) {
        applyDeltas(deltas)
      } else {
        console.log(`change arrived out of sequence currentIndex: ${currentIndex}, change index:${index}`)
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
        deltas: $pendingDeltas
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
      applyDeltas(stateForSync.deltas);
    } else {
      console.log("WHOA, sync response has different current state assumptions")
      // TODO: resync somehow
    }
  }

  async function commitChange() {
    if (session.scribeStr == $connection.me) {
      if ($pendingDeltas.length == 0) {
        alert("No deltas to commit!");
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
          deltas: $pendingDeltas.map(d=>JSON.stringify(d)),
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
        $pendingDeltas = []
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
    applyDeltas(sessionData.deltas);
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
    <li>currentIndex: {currentIndex}
    <li>pendingDeltas: {JSON.stringify($pendingDeltas)}
    <li>folks: {folksPretty}
    <li>content.title: {$content.title}
      <li>scribe: {$scribeStr}
  </ul>
</div>
