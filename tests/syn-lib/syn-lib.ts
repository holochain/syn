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

export const oFn = (orchestrator) => {
  orchestrator.registerScenario("syn 2 nodes", async (s, t) => {
    const aliceClient = await spawnSyn(s, config);
    const bobClient = await spawnSyn(s, config);

    const aliceSyn = createSynStore(aliceClient, initialContent, applyDelta, {
      commitStrategy: {
        CommitEveryNDeltas: 3,
      },
    });
    const bobSyn = createSynStore(bobClient, initialContent, applyDelta);

    const aliceSessionStore = await aliceSyn.newSession();
    const info = get(aliceSessionStore.info);

    t.ok(info.sessionHash);
    console.log(info);

    await delay(1000);

    const bobSessionStore = await bobSyn.joinSession(info.sessionHash);

    aliceSessionStore.requestChange([{ type: "Title", value: "A new title" }]);

    await delay(1000);

    let currentContent = get(bobSessionStore.currentContent);
    t.equal(currentContent.title, "A new title");

    aliceSessionStore.requestChange([
      { type: "Title", value: "Another thing" },
    ]);

    await delay(1000);

    currentContent = get(bobSessionStore.currentContent);
    t.equal(currentContent.title, "Another thing");

    bobSessionStore.requestChange([
      { type: "Title", value: "Bob is the boss" },
    ]);

    await delay(1000);

    currentContent = get(aliceSessionStore.currentContent);
    t.equal(currentContent.title, "Bob is the boss");

    bobSessionStore.requestChange([
      { type: "Add", loc: 0, text: "Hi " },
      { type: "Add", loc: 3, text: "there" },
    ]);

    await delay(1000);

    currentContent = get(aliceSessionStore.currentContent);
    t.equal(currentContent.body, "Hi there");

    await aliceSyn.close();
    await bobSyn.close();
  });
};

let allPlayers: Player[] = [];

async function spawnSyn(s, config: ConfigSeed) {
  const [player]: Player[] = await s.players([config]);
  allPlayers.push(player);
  await s.shareAllNodes(allPlayers);
  player.setSignalHandler((signal) => {
    console.log("Received Signal for player:", signal.data.payload);
  });

  const [[syn]] = await player.installAgentsHapps(installation);
  const url = (player as any)._conductor.appClient.client.socket.url;

  const appWs = await AppWebsocket.connect(url);

  return new HolochainClient(appWs, {
    cell_id: syn.cells[0].cellId,
    cell_nick: syn.cells[0].cellNick,
  });
}
