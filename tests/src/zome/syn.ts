import { Config, InstallAgentsHapps } from '@holochain/tryorama';
import path from 'path';
import {
  applyDeltas,
  Content,
  delay,
  Delta,
  serializeHash,
  Signal,
  synDna,
  TextDelta,
} from '../common';
import { encode, decode } from '@msgpack/msgpack';
import { cloneDeepWith } from 'lodash-es';

const config = Config.gen();

console.log(synDna);

const installation: InstallAgentsHapps = [
  // one agents
  [[synDna]], // contains 1 dna
];

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

export default orchestrator => {
  orchestrator.registerScenario('syn basic zome calls', async (s, t) => {
    // Delta representation could be JSON or not, for now we are using
    // json so setting this variable to true

    const [me_player, alice_player, bob_player] = await s.players([
      config,
      config,
      config,
    ]);
    const [[me_happ]] = await me_player.installAgentsHapps(installation);
    const [[alice_happ]] = await alice_player.installAgentsHapps(installation);
    const [[bob_happ]] = await bob_player.installAgentsHapps(installation);

    await s.shareAllNodes([me_player, alice_player, bob_player]);

    const me = me_happ.cells[0];
    const alice = alice_happ.cells[0];
    const bob = bob_happ.cells[0];

    const me_pubkey = serializeHash(me.cellId[1]);
    const alice_pubkey = serializeHash(alice.cellId[1]);
    const bob_pubkey = serializeHash(bob.cellId[1]);

    let sessions = await me.call('syn', 'get_sessions');
    t.equal(Object.keys(sessions).length, 0);

    // create initial session
    let snapshotHash = await me.call(
      'syn',
      'put_snapshot',
      encode({ title: '', body: '' })
    );
    // create initial session
    let sessionInfo = await me.call('syn', 'new_session', {
      snapshotHash,
    });

    let sessionSnapshot: Content = decode(sessionInfo.snapshot) as Content;

    // I created the session, so I should be the scribe
    t.deepEqual(sessionInfo.session.scribe, me_pubkey);
    // First ever session so content should be default content
    t.deepEqual(sessionSnapshot, {
      title: '',
      body: '',
    });
    let sessionHash = sessionInfo.sessionHash;

    // check the hash_content zome call.
    let hash = await me.call('syn', 'hash_content', sessionInfo.snapshot);
    // There haven't been any commits: must be the same
    t.deepEqual(sessionInfo.session.snapshotHash, hash);

    // check get_sessions utility zome call
    sessions = await me.call('syn', 'get_sessions');
    t.equal(Object.keys(sessions).length, 1);
    t.deepEqual(Object.keys(sessions)[0], sessionHash);

    await delay(1000);

    sessions = await alice.call('syn', 'get_sessions');
    t.equal(Object.keys(sessions).length, 1);
    t.deepEqual(Object.keys(sessions)[0], sessionHash);

    // exercise the get_session zome call
    const returnedSessionInfo = await me.call(
      'syn',
      'get_session',
      sessionHash
    );
    t.deepEqual(sessionInfo, returnedSessionInfo);

    // check that initial snapshot was created by using the get_snapshot zome call
    const returned_content = await me.call(
      'syn',
      'get_snapshot',
      sessionInfo.session.snapshotHash
    );
    t.deepEqual(decode(returned_content), sessionSnapshot);

    await delay(1000);

    // alice joins session
    let aliceSessionInfo = await alice.call('syn', 'get_session', sessionHash);

    // alice should get my session
    t.deepEqual(aliceSessionInfo.sessionHash, sessionHash);
    t.deepEqual(aliceSessionInfo.session.scribe, me_pubkey);
    t.deepEqual(decode(aliceSessionInfo.snapshot), {
      title: '',
      body: '',
    });

    // set up the pending deltas array
    let pendingDeltas: TextDelta[] = [
      { type: 'Title', value: 'foo title' },
      { type: 'Add', loc: 0, text: 'bar content' },
    ];

    let new_content = applyDeltas(sessionSnapshot, pendingDeltas);
    const new_content_hash_1 = await me.call(
      'syn',
      'hash_content',
      encode(new_content)
    );

    let deltas = pendingDeltas.map(d => encode(d));

    function deepBufferToUint8Array(object: any) {
      return cloneDeepWith(object, function (value) {
        if (Buffer.isBuffer(value)) return new Uint8Array(value);
      });
    }

    // set signal handlers so we can confirm they get sent and received appropriately
    let me_signals: Signal[] = [];
    me_player.setSignalHandler(signal => {
      console.log('Received Signal for me:', signal);
      me_signals.push(deepBufferToUint8Array(signal.data.payload));
    });

    // alice signal handler
    let alice_signals: Signal[] = [];
    alice_player.setSignalHandler(signal => {
      console.log('Received Signal for alice:', signal);
      alice_signals.push(deepBufferToUint8Array(signal.data.payload));
    });

    // bob signal handler
    let bob_signals: Signal[] = [];
    bob_player.setSignalHandler(signal => {
      console.log('Received Signal for bob:', signal);
      bob_signals.push(deepBufferToUint8Array(signal.data.payload));
    });

    // add a content change
    let commit1 = {
      sessionHash: sessionInfo.sessionHash,
      sessionSnapshot: sessionInfo.session.snapshotHash,
      commit: {
        changes: {
          atSessionIndex: 0,
          deltas,
          authors: {
            [me_pubkey]: {
              atFolkIndex: 0,
              sessionChanges: [0, 1],
            },
          },
        },
        createdAt: Date.now(),
        previousCommitHashes: [],
        // this is the first change so same hash as snapshot
        previousContentHash: sessionInfo.session.snapshotHash,
        newContentHash: new_content_hash_1,
        meta: {
          witnesses: [bob_pubkey, alice_pubkey],
          appSpecific: null,
        },
      },
      participants: [],
    };
    let commit_header_hash1 = await me.call('syn', 'commit', commit1);
    t.equal(commit_header_hash1.length, 53); // is a hash

    // add a second content change
    pendingDeltas = [
      { type: 'Delete', start: 0, end: 3 },
      { type: 'Add', loc: 0, text: 'baz' },
      { type: 'Add', loc: 11, text: ' new' }, // 'baz content new'
      { type: 'Delete', start: 4, end: 11 }, // 'baz  new'
      { type: 'Add', loc: 4, text: 'monkey' }, // 'baz monkey new'
    ];
    new_content = applyDeltas(new_content, pendingDeltas);
    const new_content_hash_2 = await me.call(
      'syn',
      'hash_content',
      encode(new_content)
    );

    deltas = pendingDeltas.map(d => encode(d));

    let commit2 = {
      sessionHash: sessionInfo.sessionHash,
      sessionSnapshot: sessionInfo.session.snapshotHash,
      commit: {
        changes: {
          atSessionIndex: 2,
          deltas,
          authors: {
            [me_pubkey]: {
              atFolkIndex: 2,
              sessionChanges: [2, 3, 4, 5, 6],
            },
          },
        },
        createdAt: Date.now(),
        previousCommitHashes: [commit_header_hash1],
        previousContentHash: new_content_hash_1, // this is the second change so previous commit's hash
        newContentHash: new_content_hash_2,
        meta: {
          witnesses: [],
          appSpecific: null,
        },
      },
      participants: [],
    };
    let commit_header_hash2 = await me.call('syn', 'commit', commit2);
    // clear the pendingDeltas
    pendingDeltas = [];

    await delay(2000);

    // alice joins session
    aliceSessionInfo = await alice.call('syn', 'get_session', sessionHash);

    // alice should get my session
    t.deepEqual(aliceSessionInfo.sessionHash, sessionHash);
    t.deepEqual(aliceSessionInfo.session.scribe, me_pubkey);
    t.deepEqual(decode(aliceSessionInfo.snapshot), {
      title: '',
      body: '',
    });
    await alice.call('syn', 'send_sync_request', {
      scribe: me_pubkey,
      sessionHash: aliceSessionInfo.sessionHash,
      lastSessionIndexSeen: 0,
    });

    // check that deltas and snapshot content returned add up to the current real content
    await delay(2000); // make time for integrating new data

    let deltasFromSessionInfo = [
      aliceSessionInfo.commits[commit_header_hash1],
      aliceSessionInfo.commits[commit_header_hash2],
    ].reduce((acc, next) => [...acc, ...next.changes.deltas], [] as String[]);

    const receivedDeltas = deltasFromSessionInfo.map(d => decode(d));

    const aliceContent = applyDeltas(
      decode(aliceSessionInfo.snapshot) as Content,
      receivedDeltas
    );
    t.deepEqual(
      aliceContent,
      { title: 'foo title', body: 'baz monkey new' } // content after two commits
    );

    // confirm that the session_info's content hash matches the content_hash
    // generated by applying deltas
    hash = await alice.call('syn', 'hash_content', encode(aliceContent));
    t.deepEqual(
      aliceSessionInfo.commits[commit_header_hash2].newContentHash,
      hash
    );

    // I should receive alice's request for the state as she joins the session
    t.equal(me_signals[0].sessionHash, aliceSessionInfo.sessionHash);
    t.equal(me_signals[0].message.type, 'SyncReq');
    t.equal(me_signals[0].message.payload.folk, alice_pubkey);

    // I add some pending deltas which I will then need to send to Alice as part of her Joining.
    pendingDeltas = [
      { type: 'Title', value: "I haven't committed yet" },
      { type: 'Add', loc: 14, text: '\nBut made a new line! 🍑' },
    ];

    deltas = pendingDeltas.map(d => encode(d));

    new_content = applyDeltas(new_content, pendingDeltas);
    const new_content_hash_3 = await me.call(
      'syn',
      'hash_content',
      encode(new_content)
    );

    const state = {
      missedCommits: {
        [commit_header_hash1]: commit1.commit,
        [commit_header_hash2]: commit2.commit,
      },
      uncommittedChanges: {
        atSessionIndex: 7,
        deltas,
        authors: {
          [me_pubkey]: {
            atFolkIndex: 7,
            sessionChanges: [7, 8],
          },
        },
      },
      //currentContentHash: new_content_hash_3,
    };
    await me.call('syn', 'send_sync_response', {
      participant: alice_pubkey,
      sessionHash,
      state,
    });

    // Alice should have recieved uncommitted deltas
    await delay(500); // make time for signal to arrive
    t.equal(alice_signals[0].message.type, 'SyncResp');
    let receivedState = alice_signals[0].message.payload;
    t.deepEqual(receivedState, state); // deltas, commit, and snapshot match

    // bob joins session
    const bobSessionInfo = await alice.call('syn', 'get_session', sessionHash);
    // bob should get my session
    t.deepEqual(bobSessionInfo.session.scribe, me_pubkey);
    await bob.call('syn', 'send_sync_request', {
      scribe: me_pubkey,
      sessionHash: aliceSessionInfo.sessionHash,
      lastSessionIndexSeen: 0,
    });

    // alice sends me a change req and I should receive it
    const alice_delta: Delta = { type: 'Title', value: 'Alice in Wonderland' };
    let delta = encode(alice_delta);
    let changeRequest = {
      sessionHash: aliceSessionInfo.sessionHash,
      scribe: aliceSessionInfo.session.scribe,
      atSessionIndex: 9,
      atFolkIndex: 0,
      deltas: [delta],
    };
    await alice.call('syn', 'send_change_request', changeRequest);
    await delay(500); // make time for signal to arrive
    const sig = me_signals[2];
    t.equal(sig.message.type, 'ChangeReq');

    t.equal(sig.message.payload.atFolkIndex, 0);
    t.deepEqual(new Uint8Array(sig.message.payload.deltas[0]), delta);

    let my_deltas = [
      { type: 'Add', value: [0, 'Whoops!\n'] },
      { type: 'Title', value: 'Alice in Wonderland' },
    ];
    deltas = my_deltas.map(d => encode(d));

    const changeBundle = {
      atSessionIndex: 9,
      deltas,
      authors: {
        [me_pubkey]: {
          atFolkIndex: 9,
          sessionChanges: [9],
        },
      },
    };

    // I send a change, and alice and bob should receive it.
    await me.call('syn', 'send_change', {
      participants: [alice_pubkey, bob_pubkey],
      sessionHash,
      changes: changeBundle,
    });
    await delay(500); // make time for signal to arrive
    let a_sig = alice_signals[1];
    let b_sig = bob_signals[0];
    t.equal(a_sig.message.type, 'ChangeNotice');
    t.equal(b_sig.message.type, 'ChangeNotice');
    t.deepEqual(a_sig.message.payload.deltas, changeBundle.deltas); // delta_matches
    t.deepEqual(b_sig.message.payload.deltas, changeBundle.deltas); // delta_matches

    await alice.call('syn', 'send_heartbeat', {
      scribe: me_pubkey,
      sessionHash,
      data: 'Hello',
    });
    await delay(500); // make time for signal to arrive
    let me_sig = me_signals[3];
    t.equal(me_sig.message.type, 'Heartbeat');
    t.deepEqual(me_sig.message.payload.data, 'Hello');
    t.deepEqual(me_sig.message.payload.fromFolk, alice_pubkey);

    await me.call('syn', 'send_folk_lore', {
      participants: [alice_pubkey, bob_pubkey],
      sessionHash,
      data: {
        participants: [alice_pubkey, bob_pubkey],
      },
    });
    await delay(500); // make time for signal to arrive

    a_sig = alice_signals[2];
    b_sig = bob_signals[1];
    t.equal(a_sig.message.type, 'FolkLore');
    t.equal(b_sig.message.type, 'FolkLore');
    t.deepEqual(a_sig.message.payload, {
      participants: [alice_pubkey, bob_pubkey],
    });
    t.deepEqual(b_sig.message.payload, {
      participants: [alice_pubkey, bob_pubkey],
    });

    // alice asks for a sync request
    await alice.call('syn', 'send_sync_request', {
      scribe: me_pubkey,
      sessionHash: aliceSessionInfo.sessionHash,
      lastSessionIndexSeen: 0,
    });
    await delay(500); // make time for signal to arrive
    me_sig = me_signals[4];
    t.equal(me_sig.message.type, 'SyncReq');

    // confirm that all agents got added to the folks anchor
    // TODO figure out why init doesn't happen immediately.
    let folks = await me.call('syn', 'get_folks');
    t.equal(folks.length, 3);


    await me.call('syn', 'delete_session', sessionHash);

    // check get_sessions utility zome call
    sessions = await me.call('syn', 'get_sessions');
    t.equal(Object.keys(sessions).length, 0);

    await delay(500); 

    // check get_sessions utility zome call
    sessions = await alice.call('syn', 'get_sessions');
    t.equal(Object.keys(sessions).length, 0);
  });
};
