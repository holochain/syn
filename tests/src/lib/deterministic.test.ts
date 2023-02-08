import test from 'node:test';
import assert from 'node:assert';

import { runScenario } from '@holochain/tryorama';

import { SynStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import isEqual from 'lodash-es/isEqual';

import { sampleGrammar, synHapp } from '../common.js';

test(
  'two agents creating the same deterministic root get the same root hash',
  { concurrency: 0 },
  async t => {
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
        new SynClient(alice.conductor.appAgentWs(), 'syn-test')
      );
      const bobSyn = new SynStore(
        new SynClient(bob.conductor.appAgentWs(), 'syn-test')
      );

      const aliceRootStore = await aliceSyn.createRoot(sampleGrammar);
      const bobRootStore = await bobSyn.createRoot(sampleGrammar);

      assert.ok(
        !isEqual(aliceRootStore.root.entryHash, bobRootStore.root.entryHash)
      );

      const aliceRootStoreD = await aliceSyn.createDeterministicRoot(
        sampleGrammar
      );
      const bobRootStoreD = await bobSyn.createDeterministicRoot(sampleGrammar);

      assert.ok(
        isEqual(aliceRootStoreD.root.entryHash, bobRootStoreD.root.entryHash)
      );
    });
  }
);
