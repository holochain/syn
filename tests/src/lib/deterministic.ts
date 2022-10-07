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
  const aliceSyn = new SynStore(new SynClient(aliceClient));
  const bobSyn = new SynStore(new SynClient(bobClient));

  const aliceRootStore = await aliceSyn.createDeterministicRoot(sampleGrammar);
  const bobRootStore = await bobSyn.createDeterministicRoot(sampleGrammar);
  console.log(aliceRootStore.root.entryHash, bobRootStore.root.entryHash);
  t.ok(isEqual(aliceRootStore.root.entryHash, bobRootStore.root.entryHash));

  t.end();
};
