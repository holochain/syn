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
  const [aliceClient, bobClient] = await spawnSyn(scenario, 2);
  const aliceSyn = new SynStore(new SynClient(aliceClient,'syn-test'));
  const bobSyn = new SynStore(new SynClient(bobClient,'syn-test'));

  const aliceRootStore = await aliceSyn.createRoot(sampleGrammar);
  const bobRootStore = await bobSyn.createRoot(sampleGrammar);

  t.ok(!isEqual(aliceRootStore.root.entryHash, bobRootStore.root.entryHash));

  const aliceRootStoreD = await aliceSyn.createDeterministicRoot(sampleGrammar);
  const bobRootStoreD = await bobSyn.createDeterministicRoot(sampleGrammar);

  t.ok(isEqual(aliceRootStoreD.root.entryHash, bobRootStoreD.root.entryHash));

  t.end();
};
