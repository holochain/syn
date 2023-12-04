import { assert, test } from 'vitest';

import { dhtSync, runScenario } from '@holochain/tryorama';
import { get, toPromise } from '@holochain-open-dev/stores';

import {
  SynStore,
  stateFromCommit,
  DocumentStore,
  WorkspaceStore,
} from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import { TextEditorDeltaType } from '../grammar.js';

import {
  waitForOtherParticipants,
  delay,
  sampleGrammar,
  synHapp,
} from '../common.js';

test('SynStore, DocumentStore, WorkspaceStore and SessionStore work', async () => {
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
      new SynClient(alice.appAgentWs as any, 'syn-test')
    );
    const bobSyn = new SynStore(
      new SynClient(bob.appAgentWs as any, 'syn-test')
    );

    const { documentHash, firstCommitHash } = await aliceSyn.createDocument(
      sampleGrammar
    );
    await aliceSyn.client.tagDocument(documentHash, 'active');
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
    let documentsHashes = Array.from(
      (await toPromise(bobSyn.documentsByTag.get('active'))).keys()
    );
    assert.equal(documentsHashes.length, 1);

    await aliceSyn.client.removeDocumentTag(documentHash, 'active');
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
    documentsHashes = Array.from(
      (await toPromise(bobSyn.documentsByTag.get('active'))).keys()
    );
    assert.equal(documentsHashes.length, 0);

    const aliceDocumentStore = new DocumentStore(
      aliceSyn,
      sampleGrammar,
      documentHash
    );
    const workspaceHash = await aliceDocumentStore.createWorkspace(
      'main',
      firstCommitHash
    );
    const aliceWorkspaceStore = new WorkspaceStore(
      aliceDocumentStore,
      workspaceHash
    );
    const aliceSessionStore = await aliceWorkspaceStore.joinSession();

    await delay(2000);

    const bobDocumentStore = new DocumentStore(
      bobSyn,
      sampleGrammar,
      documentHash
    );
    const bobWorkspaceStore = new WorkspaceStore(
      bobDocumentStore,
      workspaceHash
    );

    const bobSessionStore = await bobWorkspaceStore.joinSession();
    await waitForOtherParticipants(aliceSessionStore, 1);
    await waitForOtherParticipants(bobSessionStore, 1);

    aliceSessionStore.requestChanges([{ type: 'Title', value: 'A new title' }]);

    await delay(7000);

    let participants = get(aliceSessionStore.participants);
    assert.equal(participants.active.length, 2);

    let currentState = get(bobSessionStore.state);
    assert.equal(currentState.title, 'A new title');

    aliceSessionStore.requestChanges([
      { type: 'Title', value: 'Another thing' },
    ]);

    await delay(1000);

    currentState = get(bobSessionStore.state);
    assert.equal(currentState.title, 'Another thing');

    bobSessionStore.requestChanges([
      { type: 'Title', value: 'Bob is the boss' },
    ]);

    await delay(1000);

    currentState = get(bobSessionStore.state);
    assert.equal(currentState.title, 'Bob is the boss');

    currentState = get(aliceSessionStore.state);
    assert.equal(currentState.title, 'Bob is the boss');

    bobSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Hi ' },
      { type: TextEditorDeltaType.Insert, position: 3, text: 'there' },
    ]);

    await delay(1000);

    currentState = get(aliceSessionStore.state);
    assert.equal(currentState.body.text.toString(), 'Hi there');

    currentState = get(bobSessionStore.state);
    assert.equal(currentState.body.text.toString(), 'Hi there');

    // Test concurrent

    aliceSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 3, text: 'alice ' },
    ]);
    bobSessionStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 3, text: 'bob ' },
    ]);

    await delay(7000);

    const currentStateAlice = get(aliceSessionStore.state);
    const currentStateBob = get(bobSessionStore.state);
    assert.equal(
      currentStateAlice.body.text.toString(),
      currentStateBob.body.text.toString()
    );

    await aliceSessionStore.commitChanges();
    await delay(7000);
    const commitsLinks = await aliceSyn.client.getWorkspaceTips(workspaceHash);

    assert.equal(commitsLinks.length, 1);

    const commitHash = commitsLinks[commitsLinks.length - 1].target;
    const commit = await aliceSyn.client.getCommit(commitHash);

    assert.ok(commitHash);
    assert.ok(commit);
    const state = stateFromCommit(commit!.entry);
    assert.deepEqual(state, currentStateAlice);

    await bobSessionStore.leaveSession();

    await delay(1000);

    participants = get(aliceSessionStore.participants);

    assert.equal(participants.active.length, 1);

    await aliceSessionStore.leaveSession();
  });
});
