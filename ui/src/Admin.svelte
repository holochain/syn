<script>

  import {AdminWebsocket, AppWebsocket} from '@holochain/conductor-api'
  let adminPort=1234;
  let appPort=8888;
  let connection;
;
  async function toggle() {
    if (!connection) {
      connection = {}
      const appClient = await AppWebsocket.connect(`ws://localhost:${appPort}`);
      console.log("connected", appClient)
      const appInfo = await appClient.appInfo({ installed_app_id: "syn" });
      const cellId = appInfo.cell_data[0][0];
      const agentPubKey = cellId[1];
      connection = {
        appClient,
        appInfo,
        cellId,
        agentPubKey
      }
      console.log("active", connection);
      const r = await callZome("join_session");
      console.log("joined", r, {});
    } else {
      connection = undefined
    }
  }

  const callZome = async (
    fn_name,
    payload,
    timeout
  ) => {
    if (!connection) {
      console.og("callZome called when disconnected from conductor");
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
//      if (error == "Error: Socket is not open")
// TODO        return doResetConnection(dispatch);
    }
  };
</script>

App Port: <input bind:value={appPort}>

{#if connection}
  <button on:click={toggle}>

    Disconnect
  </button>
{:else}
  <button on:click={toggle}>
    Connect
  </button>
{/if}
