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

    const aliceRootHash = await aliceSyn.createDocument(sampleGrammar);
    const bobRootHash = await bobSyn.createDocument(sampleGrammar);

    assert.ok(aliceRootHash.toString() !== bobRootHash.toString());

    const aliceRootHashDeterministic =
      await aliceSyn.createDeterministicDocument(sampleGrammar);
    const bobRootHashDeterministic = await bobSyn.createDeterministicDocument(
      sampleGrammar
    );

    assert.ok(
      aliceRootHashDeterministic.toString() ===
        bobRootHashDeterministic.toString()
    );
  });
});
