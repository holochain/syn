import path from "path";
import {
  Config,
  InstallAgentsHapps,
  Player,
  ConfigSeed,
} from "@holochain/tryorama";
import { Content } from "@syn/zome-client";

import { HolochainClient } from "@holochain-open-dev/cell-client";
import { AppWebsocket } from "@holochain/conductor-api";
import { applyDelta, delay, initialContent } from "../common.js";
import { get } from "svelte/store";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { createSynStore } from "@syn/store";

const config = Config.gen();

const dna = path.join(__dirname, "../../syn.dna");

console.log(dna);

const installation: InstallAgentsHapps = [
  // one agents
  [[dna]], // contains 1 dna
];

process.on("unhandledRejection", (error) => {
  // Will print "unhandledRejection err is not defined"
  console.log("unhandledRejection", error);
});

// Delta representation could be JSON or not, for now we are using
// json so setting this variable to true
const jsonDeltas = true;
export const oFn = (orchestrator) => {
  const default_content: Content = { title: "", body: "", meta: {} };
  /*    orchestrator.registerScenario('syn connect', async (s, t) => {
          const [me_player] = await s.players([config])
          const [[me_happ]] = await me_player.installAgentsHapps(installation)
          const app_port = me_player._conductor.app_ws.client.socket._url.split(":")[2];
          const c = new Connection(app_port, me_happ.hAppId)
          t.equal(c.app_port, app_port)
          t.equal(c.app_id, me_happ.hAppId)
          t.equal(c.sessions.length, 0)
          t.equal(c.syn, undefined)
          t.equal(c.app_ws, undefined)

          await c.open(default_content, () => {})
          t.notEqual(c.app_ws, undefined)
          t.deepEqual(c.syn.default_content, default_content)
      })*/
  orchestrator.registerScenario("syn 2 nodes", async (s, t) => {
    const aliceClient = await spawnSyn(s, config);
    const bobClient = await spawnSyn(s, config);

    const aliceSyn = createSynStore(aliceClient, initialContent, applyDelta);
    const bobSyn = createSynStore(bobClient, initialContent, applyDelta);

    const aliceSessionStore = await aliceSyn.newSession();
    const info = get(aliceSessionStore.info);

    const bobSessionStore = await bobSyn.joinSession(info.sessionHash);

    aliceSessionStore.requestChange([{ type: "Title", value: "A new title" }]);

    await delay(500);

    let currentContent = get(bobSessionStore.currentContent);

    t.equal(currentContent.title, "A new title");
  });
};

let allPlayers: Player[] = [];

async function spawnSyn(s, config: ConfigSeed) {
  const [player]: Player[] = await s.players([config]);
  allPlayers.push(player);
  await s.shareAllNodes(allPlayers);

  const [[syn]] = await player.installAgentsHapps(installation);
  const url = (player as any)._conductor.appClient.client.socket.url;

  const appWs = await AppWebsocket.connect(url);

  return new HolochainClient(appWs, {
    cell_id: syn.cells[0].cellId,
    cell_nick: syn.cells[0].cellNick,
  });
}
