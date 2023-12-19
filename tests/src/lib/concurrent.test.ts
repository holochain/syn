import { assert, test } from 'vitest';

import { runScenario } from '@holochain/tryorama';

import { get, toPromise } from '@holochain-open-dev/stores';
import { SynStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

import {
  delay,
  sampleGrammar,
  synHapp,
  waitForOtherParticipants,
} from '../common.js';
import { textEditorGrammar } from '../text-editor-grammar.js';

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

    const aliceDocumentStore = await aliceSyn.createDocument(
      sampleGrammar.initialState()
    );
    const aliceWorkspaceStore = await aliceDocumentStore.createWorkspace(
      'main',
      undefined
    );

    const aliceSessionStore = await aliceWorkspaceStore.joinSession();

    aliceSessionStore.change((state, eph) =>
      textEditorGrammar
        .changes(alice.agentPubKey, state.body, eph)
        .insert(0, '\n')
    );

    await delay(2000);

    const bobDocumentStore = await toPromise(
      bobSyn.documents.get(aliceDocumentStore.documentHash)
    );
    const workspaces = await toPromise(bobDocumentStore.allWorkspaces);
    assert.equal(
      new Buffer(Array.from(workspaces.keys())[0]).toString(),
      aliceWorkspaceStore.workspaceHash.toString()
    );
    const bobWorkspaceStore = await toPromise(
      bobDocumentStore.workspaces.get(aliceWorkspaceStore.workspaceHash)
    );
    const bobSessionStore = await bobWorkspaceStore.joinSession();

    await waitForOtherParticipants(bobSessionStore, 1);
    await waitForOtherParticipants(aliceSessionStore, 1);

    await delay(2000);

    async function simulateAlice() {
      for (let i = 0; i < aliceLine.length; i++) {
        aliceSessionStore.change((state, eph) =>
          textEditorGrammar
            .changes(alice.agentPubKey, state.body, eph)
            .insert(
              alicePosition(get(aliceSessionStore.state).body.text.toString()),
              aliceLine[i]
            )
        );
        await delay(1000);
      }
    }

    async function simulateBob() {
      for (let i = 0; i < bobLine.length; i++) {
        let content = get(bobSessionStore.state).body.text;
        bobSessionStore.change((state, eph) =>
          textEditorGrammar
            .changes(bob.agentPubKey, state.body, eph)
            .insert(bobPosition(content.toString()), bobLine[i])
        );
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
