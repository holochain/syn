import {
  Config,
  InstallAgentsHapps,
  Player,
  ConfigSeed,
} from '@holochain/tryorama';

import { get } from 'svelte/store';
import { SynGrammar, SynStore } from '@holochain-syn/store';
import { TextEditorDeltaType } from '../grammar';
import Automerge from 'automerge';

import { Content, delay, sampleGrammar, synDna, TextDelta } from '../common';
import { spawnSyn } from './spawn';

const config = Config.gen();

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

    currentState = get(bobSessionStore.state);
    t.equal(currentState.title, 'Bob is the boss');

    currentState = get(aliceSessionStore.state);
    t.equal(currentState.title, 'Bob is the boss');

    bobSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Hi ' },
      { type: TextEditorDeltaType.Insert, position: 3, text: 'there' },
    ]);

    await delay(1000);

    currentState = get(aliceSessionStore.state);
    t.equal(currentState.body.text.toString(), 'Hi there');

    currentState = get(bobSessionStore.state);
    t.equal(currentState.body.text.toString(), 'Hi there');

    // Test concurrent

    aliceSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 3, text: 'alice ' },
    ]);
    bobSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 3, text: 'bob ' },
    ]);

    await delay(1000);

    const currentStateAlice = get(aliceSessionStore.state);
    const currentStateBob = get(bobSessionStore.state);
    t.equal(
      currentStateAlice.body.text.toString(),
      currentStateBob.body.text.toString()
    );

    await bobSyn.close();

    await delay(1000);

    const folks = get(aliceSessionStore.folks);

    t.equal(Object.keys(folks).length, 0);

    await aliceSyn.close();

    process.exit(0);
  });
};
