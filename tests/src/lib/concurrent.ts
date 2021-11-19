import {
  Config,
  InstallAgentsHapps,
  Player,
  ConfigSeed,
  Orchestrator,
} from '@holochain/tryorama';

import { HolochainClient } from '@holochain-open-dev/cell-client';
import { AppWebsocket } from '@holochain/conductor-api';
import { get } from 'svelte/store';
import { SynGrammar, SynStore, DebouncingStore } from '@syn/store';
import { TextEditorDeltaType } from '../grammar';

import {
  applyDelta,
  Content,
  delay,
  sampleGrammar,
  TextDelta,
} from '../common';
import { spawnSyn } from './spawn';

const config = Config.gen();

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

const aliceLine = 'ñlkjlñkj';
const bobLine = 'fgjhfgjhfg';

function alicePosition(text: string) {
  return text.split('\n')[0].length;
}
function bobPosition(text: string) {
  return text.length;
}

export default (orchestrator: Orchestrator<any>) => {
  orchestrator.registerScenario('syn 2 nodes', async (s, t) => {
    const aliceClient = await spawnSyn(s, config);
    const bobClient = await spawnSyn(s, config);

    const aliceSyn = new SynStore(aliceClient, sampleGrammar, {
      commitStrategy: { CommitEveryNDeltas: 3 }, // TODO: reduce ms
    });
    const bobSyn = new SynStore(bobClient, sampleGrammar, {});

    const aliceSessionStore = await aliceSyn.newSession();
    const sessionHash = aliceSessionStore.sessionHash;

    t.ok(aliceSessionStore.sessionHash);
    t.equal(aliceSessionStore.session.scribe, aliceSyn.myPubKey);

    aliceSessionStore.requestChanges([
      {
        type: TextEditorDeltaType.Insert,
        position: 0,
        text: '\n',
      },
    ]);

    await delay(2000);

    const bobSessionStore = await bobSyn.joinSession(sessionHash);

    async function simulateAlice() {
      for (let i = 0; i < aliceLine.length; i++) {
        aliceSessionStore.requestChanges([
          {
            type: TextEditorDeltaType.Insert,
            position: alicePosition(get(aliceSessionStore.state).body.text),
            text: aliceLine[i],
          },
        ]);
        await delay(300);
      }
    }

    async function simulateBo() {
      for (let i = 0; i < bobLine.length; i++) {
        let content = get(bobSessionStore.state).body.text;
        bobSessionStore.requestChanges([
          {
            type: TextEditorDeltaType.Insert,
            position: bobPosition(content),
            text: bobLine[i],
          },
        ]);
        await delay(300);
      }
    }

    await Promise.all([simulateAlice(), simulateBo()]);

    await delay(4000);

    await Promise.all([simulateAlice(), simulateBo()]);
    await delay(4000);

    await Promise.all([simulateAlice(), simulateBo()]);
    await delay(4000);


    console.log('hi');
    const expectedText = `${aliceLine}${aliceLine}${aliceLine}
${bobLine}${bobLine}${bobLine}`;

    let currentState = get(aliceSessionStore.state);
    t.deepEqual(currentState.body.text, expectedText);

    currentState = get(bobSessionStore.state);
    t.deepEqual(currentState.body.text, expectedText);

    await bobSyn.close();

    await aliceSyn.close();

    await delay(1000);
  });
};
