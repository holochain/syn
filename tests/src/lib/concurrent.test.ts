import { assert, test } from 'vitest';

import { runScenario } from '@holochain/tryorama';

import { get, toPromise } from '@holochain-open-dev/stores';
import { RootStore, SynStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

import { TextEditorDeltaType } from '../grammar.js';
import { delay, sampleGrammar, synHapp } from '../common.js';

const aliceLine = 'ALICE_HELLO_ALICE';
const bobLine = 'BOB_HI_BOB';

function alicePosition(text: string) {
  return text.split('\n')[0].length;
}
function bobPosition(text: string) {
  return text.length;
}

test('the state of two agents making lots of concurrent changes converges', async () => {
  await runScenario(async scenario => {
    // Set up the app to be installed
    const appSource = { appBundleSource: { path: synHapp } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([
      appSource,
      appSource,
    ]);
    await scenario.shareAllAgents();
    const aliceSyn = new SynStore(
      new SynClient(alice.conductor.appAgentWs(), 'syn-test')
    );
    const bobSyn = new SynStore(
      new SynClient(bob.conductor.appAgentWs(), 'syn-test')
    );

    const aliceRootStore = await aliceSyn.createRoot(sampleGrammar);
    const workspaceHash = await aliceRootStore.createWorkspace(
      'main',
      aliceRootStore.root.entryHash
    );

    const aliceWorkspaceStore = await aliceRootStore.joinWorkspace(
      workspaceHash
    );

    assert.ok(aliceWorkspaceStore.workspaceHash);

    aliceWorkspaceStore.requestChanges([
      {
        type: TextEditorDeltaType.Insert,
        position: 0,
        text: '\n',
      },
    ]);

    await delay(2000);

    const roots = await toPromise(bobSyn.allRoots);

    const bobRootStore = new RootStore(bobSyn, sampleGrammar, roots[0]);

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
    assert.deepEqual(currentState.body.text.toString(), expectedText);

    currentState = get(bobWorkspaceStore.state);
    assert.deepEqual(currentState.body.text.toString(), expectedText);

    await aliceWorkspaceStore.leaveWorkspace();
    await bobWorkspaceStore.leaveWorkspace();
  });
});
