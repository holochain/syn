import { assert, test } from 'vitest';

import { runScenario } from '@holochain/tryorama';

import { get, toPromise } from '@holochain-open-dev/stores';
import { DocumentStore, SynStore, WorkspaceStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

import { TextEditorDeltaType } from '../grammar.js';
import {
  delay,
  sampleGrammar,
  synHapp,
  waitForOtherParticipants,
} from '../common.js';

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
      new SynClient(alice.appAgentWs as any, 'syn-test')
    );
    const bobSyn = new SynStore(
      new SynClient(bob.appAgentWs as any, 'syn-test')
    );

    const { documentHash, firstCommitHash } = await aliceSyn.createDocument(
      sampleGrammar
    );
    const aliceDocumentStore = new DocumentStore(
      aliceSyn,
      sampleGrammar,
      documentHash
    );
    const workspaceHash = await aliceDocumentStore.createWorkspace(
      'main',
      firstCommitHash
    );
    const aliceWorkspaceStore = new WorkspaceStore(
      aliceDocumentStore,
      workspaceHash
    );

    const aliceSessionStore = await aliceWorkspaceStore.joinSession();

    aliceSessionStore.requestChanges([
      {
        type: TextEditorDeltaType.Insert,
        position: 0,
        text: '\n',
      },
    ]);

    await delay(2000);

    const bobDocumentStore = new DocumentStore(
      bobSyn,
      sampleGrammar,
      documentHash
    );
    const workspaces = await toPromise(bobDocumentStore.allWorkspaces);
    assert.equal(workspaces[0].entryHash.toString(), workspaceHash.toString());
    const bobWorkspaceStore = new WorkspaceStore(
      bobDocumentStore,
      workspaceHash
    );

    const bobSessionStore = await bobWorkspaceStore.joinSession();

    await waitForOtherParticipants(bobSessionStore, 1);
    await waitForOtherParticipants(aliceSessionStore, 1);

    await delay(2000);

    async function simulateAlice() {
      for (let i = 0; i < aliceLine.length; i++) {
        aliceSessionStore.requestChanges([
          {
            type: TextEditorDeltaType.Insert,
            position: alicePosition(
              get(aliceSessionStore.state).body.text.toString()
            ),
            text: aliceLine[i],
          },
        ]);
        await delay(1000);
      }
    }

    async function simulateBob() {
      for (let i = 0; i < bobLine.length; i++) {
        let content = get(bobSessionStore.state).body.text;
        bobSessionStore.requestChanges([
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

    let currentState = get(bobSessionStore.state);
    assert.deepEqual(currentState.body.text.toString(), expectedText);

    currentState = get(aliceSessionStore.state);
    assert.deepEqual(currentState.body.text.toString(), expectedText);

    await aliceSessionStore.leaveSession();
    await bobSessionStore.leaveSession();
  });
});
