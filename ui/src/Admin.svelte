<script context="module">
  export let connection
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
  const dispatch = createEventDispatcher();

  import {AdminWebsocket, AppWebsocket} from '@holochain/conductor-api'
  let adminPort=1234;
  let appPort=8888;
  let conn
  async function toggle() {
    if (!connection) {
      connection = {}
      const appClient = await AppWebsocket.connect(
        `ws://localhost:${appPort}`,
        signal => {
          console.log("Got Signal", signal)
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
      conn = connection
      console.log("active", connection);
      session = await callZome("join_session");
      session.scribeStr = arrayBufferToBase64(session.scribe);
      console.log("joined", session);
      dispatch('setStateFromSession', {
        content: session.snapshot_content,
        contentHash: session.content_hash,
        deltas: session.deltas,
      });
    } else {
      connection = undefined
      conn = undefined
    }
  }
</script>

App Port: <input bind:value={appPort}>
<button on:click={toggle}>
  {#if conn}
    Disconnect
  {:else}
    Connect
  {/if}
</button>
