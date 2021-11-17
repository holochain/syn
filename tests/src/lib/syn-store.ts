import {
  Config,
  InstallAgentsHapps,
  Player,
  ConfigSeed,
} from '@holochain/tryorama';

import { HolochainClient } from '@holochain-open-dev/cell-client';
import { AppWebsocket } from '@holochain/conductor-api';
import { get } from 'svelte/store';
import { SynGrammar, SynStore } from '@syn/store';
import { TextEditorDeltaType } from '../grammar';

import {
  applyDelta,
  Content,
  delay,
  sampleGrammar,
  synDna,
  TextDelta,
} from '../common';

const config = Config.gen();

console.log(synDna);

const installation: InstallAgentsHapps = [
  // one agent
  [[synDna]], // contains 1 dna
];

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

export const oFn = orchestrator => {
  orchestrator.registerScenario('syn 2 nodes', async (s, t) => {
    const aliceClient = await spawnSyn(s, config);
    const bobClient = await spawnSyn(s, config);

    const aliceSyn = new SynStore(aliceClient, sampleGrammar, {
      commitStrategy: {
        CommitEveryNDeltas: 3,
      },
    });
    const bobSyn = new SynStore(bobClient, sampleGrammar, {
      commitStrategy: {
        CommitEveryNDeltas: 3,
      },
    });

    const aliceSessionStore = await aliceSyn.newSession();
    const sessionHash = aliceSessionStore.sessionHash;

    t.ok(aliceSessionStore.sessionHash);
    t.equal(aliceSessionStore.session.scribe, aliceSyn.myPubKey);

    await delay(2000);

    const bobSessionStore = await bobSyn.joinSession(sessionHash);

    aliceSessionStore.requestChanges([{ type: 'Title', value: 'A new title' }]);

    await delay(2000);

    let currentState = get(bobSessionStore.state);
    t.equal(currentState.title, 'A new title');

    aliceSessionStore.requestChanges([
      { type: 'Title', value: 'Another thing' },
    ]);

    await delay(1000);

    currentState = get(bobSessionStore.state);
    t.equal(currentState.title, 'Another thing');

    bobSessionStore.requestChanges([
      { type: 'Title', value: 'Bob is the boss' },
    ]);

    await delay(1000);

    currentState = get(aliceSessionStore.state);
    t.equal(currentState.title, 'Bob is the boss');

    bobSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Hi ' },
      { type: TextEditorDeltaType.Insert, position: 3, text: 'there' },
    ]);

    await delay(1000);

    currentState = get(aliceSessionStore.state);
    t.equal(currentState.body.text, 'Hi there');

    currentState = get(bobSessionStore.state);
    t.equal(currentState.body.text, 'Hi there');

    // Test concurrent

    aliceSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 3, text: 'alice ' },
    ]);
    bobSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 3, text: 'bob ' },
    ]);

    await delay(1000);

    currentState = get(aliceSessionStore.state);
    t.equal(currentState.body.text, 'Hi alice bob there');

    currentState = get(bobSessionStore.state);
    t.equal(currentState.body.text, 'Hi alice bob there');

    await bobSyn.close();

    await delay(1000);

    const folks = get(aliceSessionStore.folks);

    t.equal(Object.keys(folks).length, 0);

    await aliceSyn.close();
  });
};

let allPlayers: Player[] = [];

async function spawnSyn(s, config: ConfigSeed) {
  const [player]: Player[] = await s.players([config]);

  player.setSignalHandler(signal => {
    console.log('Received Signal for player:', signal.data.payload);
  });

  const [[syn]] = await player.installAgentsHapps(installation);
  const url = (player as any)._conductor.appClient.client.socket.url;

  const appWs = await AppWebsocket.connect(url);

  allPlayers.push(player);
  if (allPlayers.length > 1) {
    await s.shareAllNodes(allPlayers);
  }

  return new HolochainClient(appWs, {
    cell_id: syn.cells[0].cellId,
    role_id: syn.cells[0].cellRole,
  });
}
