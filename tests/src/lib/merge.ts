import { Scenario } from '@holochain/tryorama';

import { get } from 'svelte/store';
import { SynStore, RootStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

import { delay, sampleGrammar } from '../common.js';
import { spawnSyn } from './spawn.js';
import { TextEditorDeltaType } from '../grammar.js';

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

export default t => async (scenario: Scenario) => {
  const [alice] = await spawnSyn(scenario, 1);
  let aliceSyn = new SynStore(
    new SynClient(alice.conductor.appAgentWs(), 'syn-test')
  );

  let aliceRootStore = await aliceSyn.createDeterministicRoot(sampleGrammar);
  const rootHash = aliceRootStore.root.entryHash;
  const workspaceHash = await aliceRootStore.createWorkspace('main', rootHash);
  let aliceWorkspaceStore = await aliceRootStore.joinWorkspace(workspaceHash);

  t.ok(aliceWorkspaceStore.workspaceHash);
  aliceWorkspaceStore.requestChanges([
    { type: TextEditorDeltaType.Insert, position: 0, text: 'Alice' },
  ]);

  await aliceWorkspaceStore.commitChanges();
  await delay(100);

  let currentState = get(aliceWorkspaceStore.state);
  t.equal(currentState.body.text.toString(), 'Alice');

  await aliceWorkspaceStore.leaveWorkspace();
  await alice.conductor.shutDown();

  await delay(100);

  const [bob] = await spawnSyn(scenario, 1);
  const bobSyn = new SynStore(
    new SynClient(bob.conductor.appAgentWs(), 'syn-test')
  );

  let bobRootStore = await bobSyn.createDeterministicRoot(sampleGrammar);
  await bobRootStore.createWorkspace('main', bobRootStore.root.entryHash);
  let bobWorkspaceStore = await bobRootStore.joinWorkspace(workspaceHash);

  const roots = get(await bobSyn.fetchAllRoots());
  const rootRecord = roots.entryRecords[0];
  // let participants = get(aliceWorkspaceStore.participants);
  // t.equal(participants.active.length, );

  currentState = get(bobWorkspaceStore.state);
  t.equal(currentState.body.text.toString(), '');

  bobWorkspaceStore.requestChanges([
    { type: TextEditorDeltaType.Insert, position: 0, text: 'Bob' },
  ]);

  currentState = get(bobWorkspaceStore.state);
  t.equal(currentState.body.text.toString(), 'Bob');

  await bobWorkspaceStore.leaveWorkspace();

  await alice.conductor.startUp();
  await scenario.shareAllAgents();

  await alice.conductor.connectAppAgentInterface('syn-test');
  aliceSyn = new SynStore(
    new SynClient(alice.conductor.appAgentWs(), 'syn-test')
  );
  aliceRootStore = new RootStore(aliceSyn.client, sampleGrammar, rootRecord);
  aliceWorkspaceStore = await aliceRootStore.joinWorkspace(workspaceHash);

  await delay(2000);

  currentState = get(aliceWorkspaceStore.state);

  bobWorkspaceStore = await bobRootStore.joinWorkspace(workspaceHash);
  const bobcurrentState = get(bobWorkspaceStore.state);
  // Check that state converges
  t.equal(
    currentState.body.text.toString(),
    bobcurrentState.body.text.toString()
  );

  await aliceWorkspaceStore.leaveWorkspace();
  await bobWorkspaceStore.leaveWorkspace();

  await bob.conductor.shutDown();
  await alice.conductor.shutDown();

  t.end();
};
