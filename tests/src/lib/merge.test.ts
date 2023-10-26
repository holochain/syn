import { assert, test } from 'vitest';

import { runScenario } from '@holochain/tryorama';

import { toPromise, get } from '@holochain-open-dev/stores';
import { SynStore, DocumentStore, WorkspaceStore } from '@holochain-syn/store';
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
    const rootHash = await aliceSyn.createDeterministicRoot(sampleGrammar);
    let aliceDocumentStore = new DocumentStore(aliceSyn, sampleGrammar, rootHash);

    // And a workspace with pointing to it
    const workspaceHash = await aliceDocumentStore.createWorkspace(
      'main',
      rootHash
    );
    let aliceWorkspaceStore = new WorkspaceStore(aliceDocumentStore, workspaceHash);
    assert.ok(aliceWorkspaceStore.workspaceHash);
    let aliceSessionStore = await aliceWorkspaceStore.joinSession();

    // Alice requests the change 'Alice'
    aliceSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Alice' },
    ]);

    // And commits it
    await aliceSessionStore.commitChanges();
    await delay(100);

    let currentState = get(aliceSessionStore.state);
    assert.equal(currentState.body.text.toString(), 'Alice');

    // Now Alice goes offline

    await aliceSessionStore.leaveSession();
    await alice.conductor.shutDown();

    await delay(100);
    const [bob] = await scenario.addPlayersWithApps([appSource]);
    const bobSyn = new SynStore(
      new SynClient(bob.appAgentWs as any, 'syn-test')
    );

    // Bob goes online and joins the same workspace
    const bobRootHash = await bobSyn.createDeterministicRoot(sampleGrammar);

    let bobDocumentStore = new DocumentStore(bobSyn, sampleGrammar, bobRootHash);
    const bobWorkspaceHash = await bobDocumentStore.createWorkspace(
      'main',
      bobDocumentStore.rootHash
    );
    assert.equal(bobRootHash.toString(), rootHash.toString());
    assert.equal(bobWorkspaceHash.toString(), workspaceHash.toString());
    const bobWorkspaceStore = new WorkspaceStore(bobDocumentStore, workspaceHash);
    let bobSessionStore = await bobWorkspaceStore.joinSession();

    const roots = await toPromise(bobSyn.allRoots);
    const rootRecord = roots[0];

    currentState = get(bobSessionStore.state);
    assert.equal(currentState.body.text.toString(), '');

    bobSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Bob' },
    ]);

    currentState = get(bobSessionStore.state);
    assert.equal(currentState.body.text.toString(), 'Bob');

    await bobSessionStore.leaveSession();

    await alice.conductor.startUp();
    const port = await alice.conductor.attachAppInterface();
    const aliceAppWs = await alice.conductor.connectAppAgentWs(
      port,
      alice.appId
    );
    await scenario.shareAllAgents();

    aliceSyn = new SynStore(new SynClient(aliceAppWs, 'syn-test'));
    aliceDocumentStore = new DocumentStore(
      aliceSyn,
      sampleGrammar,
      rootRecord.entryHash
    );
    aliceWorkspaceStore = new WorkspaceStore(aliceDocumentStore, workspaceHash);
    aliceSessionStore = await aliceWorkspaceStore.joinSession();

    await delay(2000);

    currentState = get(aliceSessionStore.state);

    bobSessionStore = await bobWorkspaceStore.joinSession();
    await delay(10000);
    const bobcurrentState = get(bobSessionStore.state);
    // Check that state converges
    assert.equal(
      currentState.body.text.toString(),
      bobcurrentState.body.text.toString()
    );

    await aliceSessionStore.leaveSession();
    await bobSessionStore.leaveSession();

    await bob.conductor.shutDown();
    await alice.conductor.shutDown();
  });
});
