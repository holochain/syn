import { Scenario } from '@holochain/tryorama';

import { SynStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import isEqual from 'lodash-es/isEqual';

import { sampleGrammar } from '../common.js';
import { spawnSyn } from './spawn.js';

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

export default t => async (scenario: Scenario) => {
  const [alice, bob] = await spawnSyn(scenario, 2);
  await scenario.shareAllAgents();
  const aliceSyn = new SynStore(
    new SynClient(alice.conductor.appAgentWs(), 'syn-test')
  );
  const bobSyn = new SynStore(
    new SynClient(bob.conductor.appAgentWs(), 'syn-test')
  );

  const aliceRootStore = await aliceSyn.createRoot(sampleGrammar);
  const bobRootStore = await bobSyn.createRoot(sampleGrammar);

  t.ok(!isEqual(aliceRootStore.root.entryHash, bobRootStore.root.entryHash));

  const aliceRootStoreD = await aliceSyn.createDeterministicRoot(sampleGrammar);
  const bobRootStoreD = await bobSyn.createDeterministicRoot(sampleGrammar);

  t.ok(isEqual(aliceRootStoreD.root.entryHash, bobRootStoreD.root.entryHash));

  await bob.conductor.shutDown();
  await alice.conductor.shutDown();
  t.end();
};
