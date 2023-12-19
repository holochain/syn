import { assert, test } from 'vitest';

import { dhtSync, runScenario } from '@holochain/tryorama';

import { get, toPromise } from '@holochain-open-dev/stores';
import { SynStore } from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';

import {
  delay,
  sampleGrammar,
  synHapp,
  waitForOtherParticipants,
} from '../common.js';
import { textEditorGrammar } from '../text-editor-grammar.js';

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
    let aliceDocumentStore = await aliceSyn.createDeterministicDocument(
      sampleGrammar.initialState()
    );

    // And a workspace with pointing to it
    let aliceWorkspaceStore = await aliceDocumentStore.createWorkspace(
      'main',
      undefined
    );
    assert.ok(aliceWorkspaceStore.workspaceHash);
    let aliceSessionStore = await aliceWorkspaceStore.joinSession();

    // Alice requests the change 'Alice'
    aliceSessionStore.change((state, eph) =>
      textEditorGrammar
        .changes(alice.agentPubKey, state.body, eph)
        .insert(0, 'Alice')
    );

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
    let bobDocumentStore = await bobSyn.createDeterministicDocument(
      sampleGrammar.initialState()
    );

    let bobWorkspaceStore = await bobDocumentStore.createWorkspace(
      'main',
      undefined
    );
    assert.equal(
      bobDocumentStore.documentHash.toString(),
      aliceDocumentStore.documentHash.toString()
    );
    assert.equal(
      bobWorkspaceStore.workspaceHash.toString(),
      aliceWorkspaceStore.workspaceHash.toString()
    );
    let bobSessionStore = await bobWorkspaceStore.joinSession();

    currentState = get(bobSessionStore.state);
    assert.equal(currentState.body.text.toString(), '');

    bobSessionStore.change((state, eph) =>
      textEditorGrammar
        .changes(bob.agentPubKey, state.body, eph)
        .insert(0, 'Bob')
    );

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

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    aliceSyn = new SynStore(new SynClient(aliceAppWs, 'syn-test'));
    aliceDocumentStore = await toPromise(
      aliceSyn.documents.get(aliceDocumentStore.documentHash)
    );
    aliceWorkspaceStore = await toPromise(
      aliceDocumentStore.workspaces.get(aliceWorkspaceStore.workspaceHash)
    );
    aliceSessionStore = await aliceWorkspaceStore.joinSession();

    bobSessionStore = await bobWorkspaceStore.joinSession();

    await waitForOtherParticipants(aliceSessionStore, 1);
    await waitForOtherParticipants(bobSessionStore, 1);

    currentState = get(aliceSessionStore.state);

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
