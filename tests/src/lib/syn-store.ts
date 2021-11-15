import {
  Config,
  InstallAgentsHapps,
  Player,
  ConfigSeed,
} from '@holochain/tryorama';

import { HolochainClient } from '@holochain-open-dev/cell-client';
import { AppWebsocket } from '@holochain/conductor-api';
import { get } from 'svelte/store';
import { SynEngine, SynStore } from '@syn/store';

import {
  applyDelta,
  Content,
  delay,
  initialContent,
  synDna,
  TextDelta,
} from '../common';
import { Dictionary } from 'lodash';

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

    const synEngine: SynEngine<Content, TextDelta, Dictionary<number>> = {
      initialContent,
      applyDelta,
      ephemeral: {
        initialState: {} as any,
        applyEphemeral: (s, c) => ({ ...s, ...c }),
      },
    };

    const aliceSyn = new SynStore(aliceClient, synEngine, {
      commitStrategy: {
        CommitEveryNDeltas: 3,
      },
    });
    const bobSyn = new SynStore(bobClient, synEngine, {
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

    aliceSessionStore.requestChanges({
      deltas: [{ type: 'Title', value: 'A new title' }],
    });

    await delay(2000);

    let currentContent = get(bobSessionStore.content);
    t.equal(currentContent.title, 'A new title');

    aliceSessionStore.requestChanges({
      deltas: [{ type: 'Title', value: 'Another thing' }],
      ephemeral: {
        hi: 2,
      },
    });

    await delay(1000);
    let currentEphemeral = get(aliceSessionStore.ephemeral);
    t.deepEqual(currentEphemeral, { hi: 2 });

    currentContent = get(bobSessionStore.content);
    t.equal(currentContent.title, 'Another thing');

    bobSessionStore.requestChanges({
      deltas: [{ type: 'Title', value: 'Bob is the boss' }],
    });

    await delay(1000);

    currentContent = get(aliceSessionStore.content);
    t.equal(currentContent.title, 'Bob is the boss');

    bobSessionStore.requestChanges({
      deltas: [
        { type: 'Add', loc: 0, text: 'Hi ' },
        { type: 'Add', loc: 3, text: 'there' },
      ],
      ephemeral: {
        hi: 3,
      },
    });

    await delay(1000);

    currentContent = get(aliceSessionStore.content);
    t.equal(currentContent.body, 'Hi there');

    currentContent = get(bobSessionStore.content);
    t.equal(currentContent.body, 'Hi there');

    currentEphemeral = get(aliceSessionStore.ephemeral);
    t.deepEqual(currentEphemeral, { hi: 3 });

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
