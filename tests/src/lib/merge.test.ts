import { assert, test } from 'vitest';

import { runScenario } from '@holochain/tryorama';

import { toPromise, get } from '@holochain-open-dev/stores';
import { SynStore, RootStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

import { delay, sampleGrammar, synHapp } from '../common.js';
import { TextEditorDeltaType } from '../grammar.js';

test('check that the state of disconnected agents making changes converges after connecting', async () => {
  await runScenario(async scenario => {
    // Set up the app to be installed
    const appSource = { appBundleSource: { path: synHapp } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice] = await scenario.addPlayersWithApps([appSource]);

    let aliceSyn = new SynStore(
      new SynClient(alice.appAgentWs as any, 'syn-test')
    );

    // Alice creates a root commit
    let aliceRootStore = await aliceSyn.createDeterministicRoot(sampleGrammar);
    const rootHash = aliceRootStore.root.entryHash;

    // And a workspace with pointing to it
    const workspaceHash = await aliceRootStore.createWorkspace(
      'main',
      rootHash
    );
    let aliceWorkspaceStore = await aliceRootStore.joinWorkspace(workspaceHash);

    assert.ok(aliceWorkspaceStore.workspaceHash);

    // Alice requests the change 'Alice'
    aliceWorkspaceStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Alice' },
    ]);

    // And commits it
    await aliceWorkspaceStore.commitChanges();
    await delay(100);

    let currentState = get(aliceWorkspaceStore.state);
    assert.equal(currentState.body.text.toString(), 'Alice');

    // Now Alice goes offline

    await aliceWorkspaceStore.leaveWorkspace();
    await alice.conductor.shutDown();

    await delay(100);
    const [bob] = await scenario.addPlayersWithApps([appSource]);
    const bobSyn = new SynStore(
      new SynClient(bob.appAgentWs as any, 'syn-test')
    );

    // Bob goes online and joins the same workspace
    let bobRootStore = await bobSyn.createDeterministicRoot(sampleGrammar);
    const bobWorkspaceHash = await bobRootStore.createWorkspace(
      'main',
      bobRootStore.root.entryHash
    );
    assert.equal(bobWorkspaceHash.toString(), workspaceHash.toString());
    let bobWorkspaceStore = await bobRootStore.joinWorkspace(workspaceHash);

    const roots = await toPromise(bobSyn.allRoots);
    const rootRecord = roots[0];

    currentState = get(bobWorkspaceStore.state);
    assert.equal(currentState.body.text.toString(), '');

    bobWorkspaceStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Bob' },
    ]);

    currentState = get(bobWorkspaceStore.state);
    assert.equal(currentState.body.text.toString(), 'Bob');

    await bobWorkspaceStore.leaveWorkspace();

    await alice.conductor.startUp();
    const port = await alice.conductor.attachAppInterface();
    const aliceAppWs = await alice.conductor.connectAppAgentWs(
      port,
      alice.appId
    );
    await scenario.shareAllAgents();

    aliceSyn = new SynStore(new SynClient(aliceAppWs, 'syn-test'));
    aliceRootStore = new RootStore(aliceSyn, sampleGrammar, rootRecord);
    aliceWorkspaceStore = await aliceRootStore.joinWorkspace(workspaceHash);

    await delay(2000);

    currentState = get(aliceWorkspaceStore.state);

    bobWorkspaceStore = await bobRootStore.joinWorkspace(workspaceHash);
    await delay(5000);
    const bobcurrentState = get(bobWorkspaceStore.state);
    // Check that state converges
    assert.equal(
      currentState.body.text.toString(),
      bobcurrentState.body.text.toString()
    );

    await aliceWorkspaceStore.leaveWorkspace();
    await bobWorkspaceStore.leaveWorkspace();

    await bob.conductor.shutDown();
    await alice.conductor.shutDown();
  });
});
