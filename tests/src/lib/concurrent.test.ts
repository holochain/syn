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
      new SynClient(alice.appWs as any, 'syn-test')
    );
    const bobSyn = new SynStore(new SynClient(bob.appWs as any, 'syn-test'));

    const workspaceName = 'main';

    const aliceDocumentStore = await aliceSyn.createDocument(
      sampleGrammar.initialState()
    );
    const aliceWorkspaceStore = await aliceDocumentStore.createWorkspace(
      workspaceName,
      undefined
    );

    const aliceSessionStore = await aliceWorkspaceStore.joinSession();

    aliceSessionStore.change((state, eph) =>
      textEditorGrammar
        .changes(alice.agentPubKey, state.body, eph)
        .insert(0, '\n')
    );

    await delay(2000);

    const bobDocumentStore = bobSyn.documents.get(
      aliceDocumentStore.documentHash
    );
    const workspaces = await toPromise(bobDocumentStore.allWorkspaces);
    assert.equal(
      Array.from(workspaces.values())[0].workspaceHash.toString(),
      aliceWorkspaceStore.workspaceHash.toString()
    );
    const bobWorkspaceStore = bobDocumentStore.workspaces.get(
      aliceWorkspaceStore.workspaceHash
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
    await delay(20000);

    const expectedText = `${aliceLine}${aliceLine}${aliceLine}
${bobLine}${bobLine}${bobLine}`;

    let currentState = get(bobSessionStore.state);
    assert.deepEqual(currentState.body.text.toString(), expectedText);

    currentState = get(aliceSessionStore.state);
    assert.deepEqual(currentState.body.text.toString(), expectedText);

    await aliceSessionStore.leaveSession();
    await bobSessionStore.leaveSession();

    const aliceTip = await toPromise(aliceWorkspaceStore.tip);
    assert.ok(aliceTip);
    const bobTip = await toPromise(bobWorkspaceStore.tip);
    assert.ok(bobTip);
  });
});
