import { assert, test } from 'vitest';

import { runScenario } from '@holochain/tryorama';
import { get, toPromise } from '@holochain-open-dev/stores';

import { SynStore, stateFromCommit, RootStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import { TextEditorDeltaType } from '../grammar.js';

import { delay, sampleGrammar, synHapp } from '../common.js';

test('SynStore, RootStore and WorkspaceStore work', async () => {
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
      new SynClient(alice.conductor.appAgentWs(), 'syn-test')
    );
    const bobSyn = new SynStore(
      new SynClient(bob.conductor.appAgentWs(), 'syn-test')
    );

    const aliceRootStore = await aliceSyn.createRoot(sampleGrammar);
    const workspaceHash = await aliceRootStore.createWorkspace(
      'main',
      aliceRootStore.root.entryHash
    );
    const aliceWorkspaceStore = await aliceRootStore.joinWorkspace(
      workspaceHash
    );

    assert.ok(aliceWorkspaceStore.workspaceHash);

    await delay(2000);

    const roots = await toPromise(bobSyn.allRoots);

    const bobRootStore = new RootStore(bobSyn, sampleGrammar, roots[0]);

    const bobWorkspaceStore = await bobRootStore.joinWorkspace(workspaceHash);

    aliceWorkspaceStore.requestChanges([
      { type: 'Title', value: 'A new title' },
    ]);

    await delay(7000);

    let participants = get(aliceWorkspaceStore.participants);
    assert.equal(participants.active.length, 2);

    let currentState = get(bobWorkspaceStore.state);
    assert.equal(currentState.title, 'A new title');

    aliceWorkspaceStore.requestChanges([
      { type: 'Title', value: 'Another thing' },
    ]);

    await delay(1000);

    currentState = get(bobWorkspaceStore.state);
    assert.equal(currentState.title, 'Another thing');

    bobWorkspaceStore.requestChanges([
      { type: 'Title', value: 'Bob is the boss' },
    ]);

    await delay(1000);

    currentState = get(bobWorkspaceStore.state);
    assert.equal(currentState.title, 'Bob is the boss');

    currentState = get(aliceWorkspaceStore.state);
    assert.equal(currentState.title, 'Bob is the boss');

    bobWorkspaceStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Hi ' },
      { type: TextEditorDeltaType.Insert, position: 3, text: 'there' },
    ]);

    await delay(1000);

    currentState = get(aliceWorkspaceStore.state);
    assert.equal(currentState.body.text.toString(), 'Hi there');

    currentState = get(bobWorkspaceStore.state);
    assert.equal(currentState.body.text.toString(), 'Hi there');

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
    assert.equal(
      currentStateAlice.body.text.toString(),
      currentStateBob.body.text.toString()
    );

    await aliceWorkspaceStore.commitChanges();
    const commits = await aliceSyn.client.getWorkspaceTips(workspaceHash);
    assert.notEqual(commits.length, 0);

    const commit = commits[commits.length - 1];

    assert.ok(commit);
    if (commit) {
      const state = stateFromCommit(commit.entry);
      assert.deepEqual(state, currentStateAlice);
    }

    await bobWorkspaceStore.leaveWorkspace();

    await delay(1000);

    participants = get(aliceWorkspaceStore.participants);

    assert.equal(participants.active.length, 1);

    await aliceWorkspaceStore.leaveWorkspace();
  });
});
