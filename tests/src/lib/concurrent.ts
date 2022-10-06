import { Scenario } from '@holochain/tryorama';

import { get } from 'svelte/store';
import { RootStore, SynStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import { TextEditorDeltaType } from '../grammar.js';

import { delay, sampleGrammar } from '../common.js';
import { spawnSyn } from './spawn.js';

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

const aliceLine = 'ALICE_HELLO_ALICE';
const bobLine = 'BOB_HI_BOB';

function alicePosition(text: string) {
  return text.split('\n')[0].length;
}
function bobPosition(text: string) {
  return text.length;
}
export default t => async (scenario: Scenario) => {
  const [aliceClient, bobClient] = await spawnSyn(scenario, 2);
  const aliceSyn = new SynStore(new SynClient(aliceClient));
  const bobSyn = new SynStore(new SynClient(bobClient));

  const aliceRootStore = await aliceSyn.createRoot(sampleGrammar);
  const workspaceHash = await aliceRootStore.createWorkspace(
    'main',
    aliceRootStore.rootHash
  );

  const aliceWorkspaceStore = await aliceRootStore.joinWorkspace(
    workspaceHash
  );

  t.ok(aliceWorkspaceStore.workspaceHash);

  aliceWorkspaceStore.requestChanges([
    {
      type: TextEditorDeltaType.Insert,
      position: 0,
      text: '\n',
    },
  ]);

  await delay(2000);

  const roots = get(await bobSyn.fetchAllRoots());

  const [rootHash, rootCommit] = roots.entries()[0];
  const bobRootStore = new RootStore(
    bobSyn.client,
    sampleGrammar,
    rootHash,
    rootCommit
  );

  const bobWorkspaceStore = await bobRootStore.joinWorkspace(workspaceHash);

  await delay(2000);

  async function simulateAlice() {
    for (let i = 0; i < aliceLine.length; i++) {
      aliceWorkspaceStore.requestChanges([
        {
          type: TextEditorDeltaType.Insert,
          position: alicePosition(
            get(aliceWorkspaceStore.state).body.text.toString()
          ),
          text: aliceLine[i],
        },
      ]);
      await delay(1000);
    }
  }

  async function simulateBob() {
    for (let i = 0; i < bobLine.length; i++) {
      let content = get(bobWorkspaceStore.state).body.text;
      bobWorkspaceStore.requestChanges([
        {
          type: TextEditorDeltaType.Insert,
          position: bobPosition(content.toString()),
          text: bobLine[i],
        },
      ]);
      await delay(1000);
    }
  }

  await Promise.all([simulateAlice(), simulateBob()]);
  await delay(4000);

  await Promise.all([simulateAlice(), simulateBob()]);
  await delay(4000);

  await Promise.all([simulateAlice(), simulateBob()]);
  await delay(4000);

  const expectedText = `${aliceLine}${aliceLine}${aliceLine}
${bobLine}${bobLine}${bobLine}`;

  let currentState = get(aliceWorkspaceStore.state);
  t.deepEqual(currentState.body.text.toString(), expectedText);

  currentState = get(bobWorkspaceStore.state);
  t.deepEqual(currentState.body.text.toString(), expectedText);

  await aliceWorkspaceStore.leaveWorkspace();
  await bobWorkspaceStore.leaveWorkspace();
  t.end();
};
