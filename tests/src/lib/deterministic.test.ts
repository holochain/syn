import { assert, test } from 'vitest';

import { runScenario } from '@holochain/tryorama';

import { SynStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

import { sampleGrammar, synHapp } from '../common.js';

test('two agents creating the same deterministic root get the same root hash', async () => {
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
    await scenario.shareAllAgents();
    const aliceSyn = new SynStore(
      new SynClient(alice.AppWs as any, 'syn-test')
    );
    const bobSyn = new SynStore(
      new SynClient(bob.AppWs as any, 'syn-test')
    );

    const aliceDocumentStore = await aliceSyn.createDocument(
      sampleGrammar.initialState()
    );
    const bobDocumentStore = await bobSyn.createDocument(
      sampleGrammar.initialState()
    );

    assert.ok(
      aliceDocumentStore.documentHash.toString() !==
        bobDocumentStore.documentHash.toString()
    );

    const aliceDeterministicDocument =
      await aliceSyn.createDeterministicDocument(sampleGrammar.initialState());
    const bobDeterministicDocument = await bobSyn.createDeterministicDocument(
      sampleGrammar.initialState()
    );

    assert.ok(
      aliceDeterministicDocument.documentHash.toString() ===
        bobDeterministicDocument.documentHash.toString()
    );
  });
});
