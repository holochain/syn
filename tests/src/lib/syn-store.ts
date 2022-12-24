import { Scenario } from '@holochain/tryorama';

import { get } from 'svelte/store';
import { SynStore, stateFromCommit, RootStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import { TextEditorDeltaType } from '../grammar.js';

import { delay, sampleGrammar } from '../common.js';
import { spawnSyn } from './spawn.js';

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

export default t => async (scenario: Scenario) => {

  try {

  const [aliceClient, bobClient] = await spawnSyn(scenario, 2);
  const aliceSyn = new SynStore(new SynClient(aliceClient,'syn','syn-test'));
  const bobSyn = new SynStore(new SynClient(bobClient,'syn','syn-test'));

  const aliceRootStore = await aliceSyn.createRoot(sampleGrammar);
  const workspaceHash = await aliceRootStore.createWorkspace(
    'main',
    aliceRootStore.root.entryHash
  );
  const aliceWorkspaceStore = await aliceRootStore.joinWorkspace(
    workspaceHash,
  );

  t.ok(aliceWorkspaceStore.workspaceHash);

  await delay(2000);

  const roots = get(await bobSyn.fetchAllRoots());

  const bobRootStore = new RootStore(
    bobSyn.client,
    sampleGrammar,
    roots.entryRecords[0]
  );
  
  const bobWorkspaceStore = await bobRootStore.joinWorkspace(workspaceHash);

  aliceWorkspaceStore.requestChanges([{ type: 'Title', value: 'A new title' }]);

  await delay(7000);

  let participants = get(aliceWorkspaceStore.participants);
  t.equal(participants.active.length, 2);

  let currentState = get(bobWorkspaceStore.state);
  t.equal(currentState.title, 'A new title');

  aliceWorkspaceStore.requestChanges([
    { type: 'Title', value: 'Another thing' },
  ]);

  await delay(1000);

  currentState = get(bobWorkspaceStore.state);
  t.equal(currentState.title, 'Another thing');

  bobWorkspaceStore.requestChanges([
    { type: 'Title', value: 'Bob is the boss' },
  ]);

  await delay(1000);

  currentState = get(bobWorkspaceStore.state);
  t.equal(currentState.title, 'Bob is the boss');

  currentState = get(aliceWorkspaceStore.state);
  t.equal(currentState.title, 'Bob is the boss');

  bobWorkspaceStore.requestChanges([
    { type: TextEditorDeltaType.Insert, position: 0, text: 'Hi ' },
    { type: TextEditorDeltaType.Insert, position: 3, text: 'there' },
  ]);

  await delay(1000);

  currentState = get(aliceWorkspaceStore.state);
  t.equal(currentState.body.text.toString(), 'Hi there');

  currentState = get(bobWorkspaceStore.state);
  t.equal(currentState.body.text.toString(), 'Hi there');

  // Test concurrent

  aliceWorkspaceStore.requestChanges([
    { type: TextEditorDeltaType.Insert, position: 3, text: 'alice ' },
  ]);
  bobWorkspaceStore.requestChanges([
    { type: TextEditorDeltaType.Insert, position: 3, text: 'bob ' },
  ]);

  await delay(1000);

  const currentStateAlice = get(aliceWorkspaceStore.state);
  const currentStateBob = get(bobWorkspaceStore.state);
  t.equal(
    currentStateAlice.body.text.toString(),
    currentStateBob.body.text.toString()
  );

  await aliceWorkspaceStore.commitChanges()
  const getWorkspaceTip = await aliceSyn.client.getWorkspaceTip(workspaceHash)
  t.ok(getWorkspaceTip)
  const commit = await aliceSyn.client.getCommit(getWorkspaceTip)
  t.ok(commit)
  if (commit) {
    const state = stateFromCommit(commit.entry)
    t.deepEqual(state,currentStateAlice)
  }

  await bobWorkspaceStore.leaveWorkspace();

  await delay(1000);

  participants = get(aliceWorkspaceStore.participants);

  t.equal(participants.active.length, 1);

  await aliceWorkspaceStore.leaveWorkspace();
  } catch(e) {
    console.log("CAUGHT ERROR", e)
  }

  t.end()
}
