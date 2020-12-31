<script context="module">
  let connection
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

  export async function synSendChangeReq(index, delta) {
    delta.by = connection.me
    delta = JSON.stringify(delta)
    callZome('send_change_request', {scribe: session.scribe, index, delta});
  }

  export async function synSendChange(participants, deltas) {
    deltas = deltas.map(d=>JSON.stringify(d))
    callZome("send_change", {participants: p, deltas})
  }

  export async function callZome(fn_name, payload, timeout) {
    if (!connection) {
      console.log("callZome called when disconnected from conductor");
      return;
    }
    try {
      const zome_name = "syn";
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
</script>
<script>
  import { createEventDispatcher } from 'svelte';
  import { conn, scribeStr } from './stores.js';

  const dispatch = createEventDispatcher();

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
            dispatch('syncReq', {from: signal.data.payload.signal_payload});
            break;
          case "SyncResp":
            dispatch("syncResp", signal.data.payload.signal_payload);
            break;
          case "ChangeReq":
            let req = signal.data.payload.signal_payload
            req[1] = JSON.parse(req[1])
            dispatch("changeReq", req);
            break;
          case "Change":
            let deltas = signal.data.payload.signal_payload
            deltas = deltas.map(d=>JSON.parse(d))
            dispatch("change", deltas);
            break;
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
      session.snapshotHash = await callZome('hash_content', session.snapshot_content)
      session.snapshotHashStr = arrayBufferToBase64(session.snapshotHash);
      session.scribeStr = arrayBufferToBase64(session.scribe);
      $scribeStr = session.scribeStr
      console.log("joined", session);
      dispatch('setStateFromSession', {
        content: {... session.snapshot_content}, // clone so as not to pass by ref
        contentHash: session.content_hash,
        deltas: session.deltas,
      });
    } else {
      connection = undefined
      $conn = undefined
    }
  }
</script>
<style>
</style>
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
