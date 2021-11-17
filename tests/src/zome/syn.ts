import { Config, InstallAgentsHapps } from '@holochain/tryorama';
import {
  applyDeltas,
  Content,
  delay,
  Delta,
  sampleGrammar,
  serializeHash,
  Signal,
  synDna,
  TextDelta,
} from '../common';
import { encode, decode } from '@msgpack/msgpack';
import { cloneDeepWith } from 'lodash-es';
import { TextEditorDeltaType } from '@syn/text-editor';

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
    let sessionInfo = await me.call('syn', 'new_session', {});

    // First ever session so content should be default content
    let sessionSnapshot: Content = sampleGrammar.initialState;

    // I created the session, so I should be the scribe
    t.deepEqual(sessionInfo.session.scribe, me_pubkey);
    let sessionHash = sessionInfo.sessionHash;

    // check the hash_snapshot zome call.
    let hash = await me.call('syn', 'hash_snapshot', encode(sessionSnapshot));
    // There haven't been any commits
    t.deepEqual(sessionInfo.session.initialCommitHash, null);

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
    t.deepEqual(sessionInfo.session, returnedSessionInfo);

    await delay(1000);

    // alice joins session
    let aliceSessionInfo = await alice.call('syn', 'get_session', sessionHash);

    // alice should get my session
    t.deepEqual(aliceSessionInfo.scribe, me_pubkey);
    t.deepEqual(aliceSessionInfo.initialCommitHash, null);

    // set up the pending deltas array
    let pendingDeltas: TextDelta[] = [
      { type: 'Title', value: 'foo title' },
      { type: TextEditorDeltaType.Insert, position: 0, text: 'bar content' },
    ];

    let new_content = applyDeltas(sessionSnapshot, pendingDeltas, me_pubkey);
    const new_content_hash_1 = await me.call(
      'syn',
      'hash_snapshot',
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
      sessionHash: sessionHash,
      commit: {
        changes: {
          deltas: deltas.map(d => ({ author: me_pubkey, delta: d })),
          authors: {
            [me_pubkey]: {
              atFolkIndex: 0,
              commitChanges: [0, 1],
            },
          },
        },
        createdAt: Date.now(),
        previousCommitHashes: [],
        // this is the first change so same hash as snapshot
        previousContentHash: snapshotHash,
        newContentHash: new_content_hash_1,
        meta: {
          witnesses: [bob_pubkey, alice_pubkey],
          appSpecific: null,
        },
      },
      participants: [],
    };
    let commit_hash1 = await me.call('syn', 'commit_changes', commit1);
    t.equal(commit_hash1.length, 53); // is a hash

    // add a second content change
    pendingDeltas = [
      { type: TextEditorDeltaType.Delete, position: 0, characterCount: 3 },
      { type: TextEditorDeltaType.Insert, position: 0, text: 'baz' },
      { type: TextEditorDeltaType.Insert, position: 11, text: ' new' }, // 'baz content new'
      { type: TextEditorDeltaType.Delete, position: 4, characterCount: 11 }, // 'baz  new'
      { type: TextEditorDeltaType.Insert, position: 4, text: 'monkey' }, // 'baz monkey new'
    ];
    new_content = applyDeltas(new_content, pendingDeltas, me_pubkey);
    const new_content_hash_2 = await me.call(
      'syn',
      'hash_snapshot',
      encode(new_content)
    );

    deltas = pendingDeltas.map(d => encode(d));

    let commit2 = {
      sessionHash: sessionHash,
      commit: {
        changes: {
          deltas: deltas.map(d => ({ author: me_pubkey, delta: d })),
          authors: {
            [me_pubkey]: {
              atFolkIndex: 2,
              commitChanges: [0, 1, 2, 3, 4],
            },
          },
        },
        createdAt: Date.now(),
        previousCommitHashes: [commit_hash1],
        previousContentHash: new_content_hash_1, // this is the second change so previous commit's hash
        newContentHash: new_content_hash_2,
        meta: {
          witnesses: [],
          appSpecific: null,
        },
      },
      participants: [],
    };
    let commit_hash2 = await me.call('syn', 'commit_changes', commit2);
    // clear the pendingDeltas
    pendingDeltas = [];

    await delay(2000);

    // alice joins session
    aliceSessionInfo = await alice.call('syn', 'get_session', sessionHash);

    // alice should get my session
    t.deepEqual(aliceSessionInfo.scribe, me_pubkey);
    await alice.call('syn', 'send_sync_request', {
      scribe: me_pubkey,
      sessionHash: sessionHash,
      lastDeltaSeen: null,
    });

    await delay(2000); // make time for integrating new data

    // I should receive alice's request for the state as she joins the session
    t.equal(me_signals[0].sessionHash, sessionHash);
    t.equal(me_signals[0].message.type, 'SyncReq');
    t.equal(me_signals[0].message.payload.folk, alice_pubkey);

    // I add some pending deltas which I will then need to send to Alice as part of her Joining.
    pendingDeltas = [
      { type: 'Title', value: "I haven't committed yet" },
      {
        type: TextEditorDeltaType.Insert,
        position: 14,
        text: '\nBut made a new line! 🍑',
      },
    ];

    deltas = pendingDeltas.map(d => encode(d));

    new_content = applyDeltas(new_content, pendingDeltas, me_pubkey);
    const new_content_hash_3 = await me.call(
      'syn',
      'hash_snapshot',
      encode(new_content)
    );

    let state = {
      folkMissedLastCommit: {
        commitHash: commit_hash2,
        commit: commit2.commit,
        commitInitialSnapshot: encode(new_content),
      },
      uncommittedChanges: {
        deltas: pendingDeltas.map(d => ({
          author: me_pubkey,
          delta: encode(d),
        })),
        authors: {
          [me_pubkey]: {
            atFolkIndex: 7,
            commitChanges: [0, 1],
          },
        },
      },
    };

    await me.call('syn', 'send_sync_response', {
      participant: alice_pubkey,
      sessionHash: sessionHash,
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
    t.deepEqual(bobSessionInfo.scribe, me_pubkey);
    await bob.call('syn', 'send_sync_request', {
      scribe: me_pubkey,
      sessionHash: sessionHash,
      lastSessionIndexSeen: 0,
    });

    // alice sends me a change req and I should receive it
    const alice_delta: Delta = { type: 'Title', value: 'Alice in Wonderland' };
    let delta = encode(alice_delta);
    let changeRequest = {
      sessionHash: sessionHash,
      scribe: aliceSessionInfo.scribe,

      lastDeltaSeen: {
        commitHash: commit_hash2,
        deltaIndexInCommit: 2,
      },

      deltaChanges: {
        atFolkIndex: 0,
        deltas: [delta],
      },
    };
    await alice.call('syn', 'send_change_request', changeRequest);
    await delay(500); // make time for signal to arrive
    const sig = me_signals[2];
    t.equal(sig.message.type, 'ChangeReq');

    t.equal(sig.message.payload.deltaChanges.atFolkIndex, 0);
    t.deepEqual(
      new Uint8Array(sig.message.payload.deltaChanges.deltas[0]),
      delta
    );

    let my_deltas = [
      {
        author: me_pubkey,
        delta: encode({ type: 'Add', value: [0, 'Whoops!\n'] }),
      },
      {
        author: me_pubkey,
        delta: encode({ type: 'Title', value: 'Alice in Wonderland' }),
      },
    ];
    const changeBundle = {
      deltas: my_deltas,
      authors: {
        [me_pubkey]: {
          atFolkIndex: 9,
          commitChanges: [9],
        },
      },
    };

    // I send a change, and alice and bob should receive it.
    await me.call('syn', 'send_change', {
      participants: [alice_pubkey, bob_pubkey],
      sessionHash,

      lastDeltaSeen: {
        commitHash: commit_hash2,
        deltaIndexInCommit: 2,
      },
      deltaChanges: changeBundle,
    });
    await delay(500); // make time for signal to arrive
    let a_sig = alice_signals[1];
    let b_sig = bob_signals[0];
    t.equal(a_sig.message.type, 'ChangeNotice');
    t.equal(b_sig.message.type, 'ChangeNotice');
    t.deepEqual(a_sig.message.payload.deltaChanges.deltas, changeBundle.deltas); // delta_matches
    t.deepEqual(b_sig.message.payload.deltaChanges.deltas, changeBundle.deltas); // delta_matches

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

    const folkLore = {
      [alice_pubkey]: {
        lastSeen: Date.now(),
      },
      [bob_pubkey]: {
        lastSeen: Date.now(),
      },
    };

    await me.call('syn', 'send_folk_lore', {
      participants: [alice_pubkey, bob_pubkey],
      sessionHash,
      folkLore,
    });
    await delay(500); // make time for signal to arrive

    a_sig = alice_signals[2];
    b_sig = bob_signals[1];
    t.equal(a_sig.message.type, 'FolkLore');
    t.equal(b_sig.message.type, 'FolkLore');
    t.deepEqual(a_sig.message.payload, folkLore);
    t.deepEqual(b_sig.message.payload, folkLore);

    // alice asks for a sync request
    await alice.call('syn', 'send_sync_request', {
      scribe: me_pubkey,
      sessionHash: sessionHash,
      lastDeltaSeen: null,
    });
    await delay(500); // make time for signal to arrive
    me_sig = me_signals[4];
    t.equal(me_sig.message.type, 'SyncReq');

    // confirm that all agents got added to the folks anchor
    // TODO figure out why init doesn't happen immediately.
    let folks = await me.call('syn', 'get_folks');
    t.equal(folks.length, 3);

    await me.call('syn', 'close_session', {
      participants: [alice_pubkey, bob_pubkey],
      sessionHash,
    });

    // check get_sessions utility zome call
    sessions = await me.call('syn', 'get_sessions');
    t.equal(Object.keys(sessions).length, 0);

    await delay(500);

    // check get_sessions utility zome call
    sessions = await alice.call('syn', 'get_sessions');
    t.equal(Object.keys(sessions).length, 0);

    let allCommits = await alice.call('syn', 'get_all_commits');
    t.equal(Object.keys(allCommits).length, 2);
    t.equal(allCommits[commit_hash1].createdAt, commit1.commit.createdAt);
    t.equal(allCommits[commit_hash2].createdAt, commit2.commit.createdAt);
  });
};
