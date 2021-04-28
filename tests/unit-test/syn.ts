import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import { delay } from '@holochain/tryorama/lib/util'
import path from 'path'
import { Delta, Signal } from '@syn-ui/zome-client'
import { content_b, run_apply_delta_b, session_info_b } from '@syn-ui/model'

const config = Config.gen()

const dna = path.join(__dirname, '../../syn.dna')

console.log(dna)

const installation:InstallAgentsHapps = [
  // one agents
  [[dna]], // contains 1 dna
]

process.on('unhandledRejection', error=>{
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error)
})

module.exports = (orchestrator)=>{
  orchestrator.registerScenario('syn basic zome calls', async (s, t)=>{

    // Delta representation could be JSON or not, for now we are using
    // json so setting this variable to true
    const jsonDeltas = true

    const [me_player, alice_player, bob_player] = await s.players([config, config, config])
    const [[me_happ]] = await me_player.installAgentsHapps(installation)
    const [[alice_happ]] = await alice_player.installAgentsHapps(installation)
    const [[bob_happ]] = await bob_player.installAgentsHapps(installation)
    const me_ctx = {}, alice_ctx = {}, bob_ctx = {}

    await s.shareAllNodes([me_player, alice_player, bob_player])

    const me = me_happ.cells[0]
    const alice = alice_happ.cells[0]
    const bob = bob_happ.cells[0]

    const me_pubkey = me.cellId[1]
    const alice_pubkey = alice.cellId[1]
    const bob_pubkey = bob.cellId[1]

    let sessions = await me.call('syn', 'get_sessions')
    t.equal(sessions.length, 0)

    // create initial session
    const $session_info = await me.call('syn', 'new_session', { content: { title: '', body: '' } })
    const session_info = session_info_b(me_ctx)
    session_info.$ = $session_info
    // I created the session, so I should be the scribe
    t.deepEqual($session_info.scribe, me_pubkey)
    // First ever session so content should be default content
    t.deepEqual($session_info.snapshot_content, { title: '', body: '' })
    let sessionHash = $session_info.session

    // check the hash_content zome call.
    let hash = await me.call('syn', 'hash_content', $session_info.snapshot_content)
    t.deepEqual($session_info.content_hash, hash)

    // check get_sessions utility zome call
    sessions = await me.call('syn', 'get_sessions')
    t.equal(sessions.length, 1)
    t.deepEqual(sessions[0], sessionHash)

    // exercise the get_session zome call
    const returnedSessionInfo = await me.call('syn', 'get_session', sessionHash)
    t.equal(sessions.length, 1)
    t.deepEqual($session_info, returnedSessionInfo)

    // check that initial snapshot was created by using the get_content zome call
    const returned_content = await me.call('syn', 'get_content', $session_info.content_hash)
    t.deepEqual(returned_content, $session_info.snapshot_content)

    // set up the pending deltas array
    let pending_deltas:Delta[] = [{ type: 'Title', value: 'foo title' }, { type: 'Add', value: [0, 'bar content'] }]

    apply_deltas(me_ctx, pending_deltas)
    const me_content = content_b(me_ctx)
    const new_content_hash_1 = await me.call('syn', 'hash_content', me_content.$)

    let deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas

    // set signal handlers so we can confirm they get sent and received appropriately
    let me_signals:Signal[] = []
    me_player.setSignalHandler((signal)=>{
      console.log('Received Signal for me:', signal)
      me_signals.push(signal.data.payload)
    })

    // alice signal handler
    let alice_signals:Signal[] = []
    alice_player.setSignalHandler((signal)=>{
      console.log('Received Signal for alice:', signal)
      alice_signals.push(signal.data.payload)
    })

    // bob signal handler
    let bob_signals:Signal[] = []
    bob_player.setSignalHandler((signal)=>{
      console.log('Received Signal for bob:', signal)
      bob_signals.push(signal.data.payload)
    })

    // add a content change
    let commit = {
      snapshot: $session_info.content_hash,
      change: {
        deltas,
        content_hash: new_content_hash_1,
        previous_change: $session_info.content_hash, // this is the first change so same hash as snapshot
        meta: {
          contributors: [],
          witnesses: [],
          app_specific: null
        }
      },
      participants: []
    }
    let commit_header_hash = await me.call('syn', 'commit', commit)
    t.equal(commit_header_hash.length, 39) // is a hash

    // add a second content change
    pending_deltas = [
      { type: 'Delete', value: [0, 3] },
      { type: 'Add', value: [0, 'baz'] },
      { type: 'Add', value: [11, ' new'] },  // 'baz content new'
      { type: 'Delete', value: [4, 11] },    // 'baz  new'
      { type: 'Add', value: [4, 'monkey'] }, // 'baz monkey new'
    ]
    apply_deltas(me_ctx, pending_deltas)
    const new_content_hash_2 = await me.call('syn', 'hash_content', me_content.$)

    deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas
    commit = {
      snapshot: $session_info.content_hash,
      change: {
        deltas,
        content_hash: new_content_hash_2,
        previous_change: new_content_hash_1, // this is the second change so previous commit's hash
        meta: {
          contributors: [],
          witnesses: [],
          app_specific: null
        }
      },
      participants: []
    }
    commit_header_hash = await me.call('syn', 'commit', commit)
    // clear the pending_deltas
    pending_deltas = []

    // alice joins session
    const $alice_session_info = await alice.call('syn', 'get_session', sessionHash)
    const alice_session_info = session_info_b(alice_ctx)
    alice_session_info.$ = $alice_session_info
    // alice should get my session
    t.deepEqual($alice_session_info.session, sessionHash)
    t.deepEqual($alice_session_info.scribe, me_pubkey)
    t.deepEqual($alice_session_info.snapshot_content, { title: '', body: '' })
    await alice.call('syn', 'send_sync_request', { scribe: me_pubkey })

    // check that deltas and snapshot content returned add up to the current real content
    await delay(500) // make time for integrating new data
    const received_deltas:Delta[] = jsonDeltas ? $alice_session_info.deltas.map(d=>JSON.parse(d)) : $alice_session_info.deltas
    t.deepEqual(
      apply_deltas(alice_ctx, received_deltas),
      { title: 'foo title', body: 'baz monkey new' } // content after two commits
    )

    // confirm that the $session_info's content hash matches the content_hash
    // generated by applying deltas
    hash = await alice.call('syn', 'hash_content', $alice_session_info.snapshot_content)
    t.deepEqual($alice_session_info.content_hash, hash)

    // I should receive alice's request for the state as she joins the session
    t.deepEqual(me_signals[0], { signal_name: 'SyncReq', signal_payload: alice_pubkey })

    // I add some pending deltas which I will then need to send to Alice as part of her Joining.
    pending_deltas = [{ type: 'Title', value: 'I haven\'t committed yet' }, { type: 'Add', value: [14, '\nBut made a new line! 🍑'] }]

    deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas

    const state = {
      snapshot: $session_info.content_hash,
      commit: commit_header_hash,
      commit_content_hash: new_content_hash_2,
      deltas: deltas,
    }
    await me.call('syn', 'send_sync_response', {
      participant: alice_pubkey,
      state,
    })

    // Alice should have recieved uncommitted deltas
    await delay(500) // make time for signal to arrive
    t.equal(alice_signals[0].signal_name, 'SyncResp')
    let receivedState = alice_signals[0].signal_payload
    t.deepEqual(receivedState, state) // deltas, commit, and snapshot match

    // bob joins session
    const bobSessionInfo = await alice.call('syn', 'get_session', sessionHash)
    // bob should get my session
    t.deepEqual(bobSessionInfo.scribe, me_pubkey)
    await bob.call('syn', 'send_sync_request', { scribe: me_pubkey })

    // alice sends me a change req and I should receive it
    const alice_delta:Delta = { type: 'Title', value: 'Alice in Wonderland' }
    let delta = jsonDeltas ? JSON.stringify(alice_delta) : alice_delta
    await alice.call('syn', 'send_change_request', {
      scribe: $alice_session_info.scribe,
      change: [1, [delta]]
    })
    await delay(500) // make time for signal to arrive
    const sig = me_signals[2]
    t.equal(sig.signal_name, 'ChangeReq')
    const [sig_index, sig_delta] = sig.signal_payload
    t.equal(sig_index, 1)
    const receiveDelta = jsonDeltas ? JSON.parse(sig_delta) : sig_delta
    t.deepEqual(receiveDelta, alice_delta) // delta_matches

    let my_deltas = [{ type: 'Add', value: [0, 'Whoops!\n'] }, { type: 'Title', value: 'Alice in Wonderland' }]
    deltas = jsonDeltas ? my_deltas.map(d=>JSON.stringify(d)) : deltas
    // I send a change, and alice and bob should receive it.
    await me.call('syn', 'send_change', {
      participants: [alice_pubkey, bob_pubkey],
      change: [2, deltas]
    })
    await delay(500) // make time for signal to arrive
    let a_sig = alice_signals[1]
    let b_sig = bob_signals[0]
    t.equal(a_sig.signal_name, 'Change')
    t.equal(b_sig.signal_name, 'Change')
    t.deepEqual(a_sig.signal_payload, [2, deltas]) // delta_matches
    t.deepEqual(b_sig.signal_payload, [2, deltas]) // delta_matches

    await alice.call('syn', 'send_heartbeat', {
      scribe: me_pubkey,
      data: 'Hello'
    })
    await delay(500) // make time for signal to arrive
    let me_sig = me_signals[3]
    t.equal(me_sig.signal_name, 'Heartbeat')
    t.deepEqual(me_sig.signal_payload[1], 'Hello')
    t.deepEqual(me_sig.signal_payload[0], alice_pubkey)

    await me.call('syn', 'send_folk_lore', {
      participants: [alice_pubkey, bob_pubkey],
      data: 'Alice said hello'
    })
    await delay(500) // make time for signal to arrive

    a_sig = alice_signals[2]
    b_sig = bob_signals[1]
    t.equal(a_sig.signal_name, 'FolkLore')
    t.equal(b_sig.signal_name, 'FolkLore')
    t.deepEqual(a_sig.signal_payload, 'Alice said hello')
    t.deepEqual(b_sig.signal_payload, 'Alice said hello')

    // alice asks for a sync request
    await alice.call('syn', 'send_sync_request', {
      scribe: me_pubkey
    })
    await delay(500) // make time for signal to arrive
    me_sig = me_signals[4]
    t.equal(me_sig.signal_name, 'SyncReq')

    // confirm that all agents got added to the folks anchor
    // TODO figure out why init doesn't happen immediately.
    let folks = await me.call('syn', 'get_folks')
    t.equal(folks.length, 3)

    function apply_deltas(ctx:object, deltas:Delta[]) {
      const run_apply_delta = run_apply_delta_b(ctx)
      for (const delta of deltas) {
        run_apply_delta(delta)
      }
    }
  })
}
