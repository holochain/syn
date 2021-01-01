<script context="module">
  let roundTripForScribe = true
  let connection
  let _pendingDeltas
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
    const index = _pendingDeltas.length;
    if (session.scribeStr == connection.me && !roundTripForScribe) {
      addChangeAsScribe([index, delta])
    } else {
      synSendChangeReq(index, delta);
    }
  }

  async function synSendChangeReq(index, delta) {
    delta.by = connection.me
    delta = JSON.stringify(delta)
    return callZome('send_change_request', {scribe: session.scribe, index, delta});
  }

  const FLAG_TYPED_ARRAY = "FLAG_TYPED_ARRAY";

  function decodeJson(jsonStr) {
    return JSON.parse( jsonStr, function( key, value ){
      // the receiver function looks for the typed array flag
      try{
        if( "flag" in value && value.flag === FLAG_TYPED_ARRAY){
          // if found, we convert it back to a typed array
          return new window[ value.constructor ]( value.data );
        }
      }catch(e){}

      // if flag not found no conversion is done
      return value;
    });
  }

  function encodeJson(obj) {
    return JSON.stringify( obj , function( key, value ){
      // the replacer function is looking for some typed arrays.
      // If found, it replaces it by a trio
      if ( value instanceof Int8Array         ||
           value instanceof Uint8Array        ||
           value instanceof Uint8ClampedArray ||
           value instanceof Int16Array        ||
           value instanceof Uint16Array       ||
           value instanceof Int32Array        ||
           value instanceof Uint32Array       ||
           value instanceof Float32Array      ||
           value instanceof Float64Array       )
      {
        var replacement = {
          constructor: value.constructor.name,
          data: Array.apply([], value),
          flag: FLAG_TYPED_ARRAY
        }
        return replacement;
      }
      return value;
    });
  }

  async function synSendHeartbeat(participants, data) {
    data = encodeJson(data)
    return callZome("send_heartbeat", {participants, data})
  }

  async function synSendChange(participants, deltas) {
    deltas = deltas.map(d=>JSON.stringify(d))
    return callZome("send_change", {participants, deltas})
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

  export async function callZome(fn_name, payload, timeout) {
    if (!connection) {
      console.log("callZome called when disconnected from conductor");
      return;
    }
    try {
      const zome_name = "syn";
      console.log(`Making zome call ${fn_name} with:`, payload)
      const result = await connection.appClient.callZome(
        {
          cap: null,
          cell_id: connection.cellId,
          zome_name,
          fn_name,
          provenance: connection.agentPubKey,
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

</script>
<script>
  import { conn, scribeStr, content, pendingDeltas, participants} from './stores.js';
  import { createEventDispatcher } from 'svelte';

  _pendingDeltas = $pendingDeltas

  export let applyDeltas;

  const dispatch = createEventDispatcher();

  let commitInProgress = false;
  let currentCommitHeaderHash;
  $: currentCommitHeaderHashStr = arrayBufferToBase64(currentCommitHeaderHash)
  let lastCommitedContentHash;    // add delta to the pending deltas and change state

  $: lastCommitedContentHashStr = arrayBufferToBase64(lastCommitedContentHash)
  $: participantsPretty =  JSON.stringify(Object.keys($participants))

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
    const p = Object.values($participants).map(v=>v.pubKey)
    if (roundTripForScribe) {
      p.push(connection.agentPubKey)
    }
    if (p.length > 0) {
      console.log(`Sending change to ${participantsPretty}:`, delta);
      synSendChange(p , [delta])
    }
  }


  import {AdminWebsocket, AppWebsocket} from '@holochain/conductor-api'
  let adminPort=1234;
  let appPort=8888;
  async function toggle() {
    if (!connection) {
      connection = {}
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
            syncResp(state);
            break;
          case "ChangeReq":
            let req = signal.data.payload.signal_payload
            req[1] = JSON.parse(req[1])
            changeReq(req);
            break;
          case "Change":
            let deltas = signal.data.payload.signal_payload
            deltas = deltas.map(d=>JSON.parse(d))
            change(deltas);
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
      connection = {
        appClient,
        appInfo,
        cellId,
        agentPubKey,
        me: arrayBufferToBase64(agentPubKey)
      }
      $conn = connection
      console.log("active", connection);
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
      connection = undefined
      $conn = undefined
    }
  }

  // handler for the heartbeat event
  function heartbeat(data) {
    console.log("got heartbeat", data)
    if (session.scribeStr == connection.me) {
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
    if (session.scribeStr == connection.me) {
      addChangeAsScribe(change)
    } else {
      console.log("change requested but I'm not the scribe.")
    }
  }

  // handler for the change event
  function change(deltas) {
    if (session.scribeStr == connection.me) {
      if (roundTripForScribe) {
        pendingDeltas.update(d=>d.concat(deltas));
        applyDeltas(deltas)
      } else {
        console.log("change recevied but I'm the scribe, so I'm ignoring this!")
      }
    } else {
      console.log("change arrived:", deltas)
      applyDeltas(deltas)
    }
  }

  function updateParticipant(pubKey, meta) {
    console.log("pubKey", pubKey)
    const pubKeyStr = arrayBufferToBase64(pubKey);
    console.log("pubkeyStr", pubKeyStr)
    if (!(pubKeyStr in $participants) && (pubKeyStr != connection.me)) {
      $participants[pubKeyStr] = {pubKey, meta}
      $participants = $participants
    } else if (meta) {
      $participants[pubKeyStr].meta = meta
      $participants = $participants
    }
  }

  // handler for the syncReq event
  function syncReq(request) {
    const from = request.from
    if (session.scribeStr == connection.me) {
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
      const p = {...$participants}
      p[connection.me] = {
        pubKey: connection.agentPubKey
      }
      const data = {
        participants: p
      }
      synSendHeartbeat(Object.values($participants).map(v=>v.pubKey), data);
    }
    else {
      console.log("syncReq received but I'm not the scribe!")
    }
  }

  // handler for the syncResp event
  function syncResp(stateForSync) {
    // Make sure that we are working off the same snapshot and commit
    if (
        arrayBufferToBase64(stateForSync.commit_content_hash) == lastCommitedContentHashStr
       ) {
      applyDeltas(stateForSync.deltas);
    } else {
      console.log("WHOA, sync response has different current state assumptions")
      // TODO: resync somehow
    }
  }

  async function commitChange() {
    if (session.scribeStr == connection.me) {
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
    {#if $conn}
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
    <li>pendingDeltas: {JSON.stringify($pendingDeltas)}
    <li>participants: {participantsPretty}
    <li>content.title: {$content.title}
      <li>scribe: {$scribeStr}
  </ul>
</div>
