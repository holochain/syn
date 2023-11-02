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
      new SynClient(alice.appAgentWs as any, 'syn-test')
    );
    const bobSyn = new SynStore(
      new SynClient(bob.appAgentWs as any, 'syn-test')
    );

    const aliceDocument = await aliceSyn.createDocument(sampleGrammar);
    const bobDocument = await bobSyn.createDocument(sampleGrammar);

    assert.ok(
      aliceDocument.documentHash.toString() !==
        bobDocument.documentHash.toString()
    );
    assert.ok(
      aliceDocument.firstCommitHash.toString() !==
        bobDocument.firstCommitHash.toString()
    );

    const aliceDeterministicDocument =
      await aliceSyn.createDeterministicDocument(sampleGrammar);
    const bobDeterministicDocument = await bobSyn.createDeterministicDocument(
      sampleGrammar
    );

    assert.ok(
      aliceDeterministicDocument.documentHash.toString() ===
        bobDeterministicDocument.documentHash.toString()
    );
  });
});
