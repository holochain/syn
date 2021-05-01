import path from 'path'
import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import { delay } from '@holochain/tryorama/lib/util'
import { _neq } from '@ctx-core/function'
import { I } from '@ctx-core/combinators'
import { derived$, subscribe_wait_timeout, writable$ } from '@ctx-core/store'
import { bufferToBase64, EntryHash } from '@syn-ui/utils'
import { content_b, apply_deltas_b, session_info_b, join_session, leave_session } from '@syn-ui/model'
import {
  Commit, Content, Delta, my_tag_b, rpc_commit_b, rpc_get_content_b, rpc_get_folks_b, rpc_get_session_b,
  rpc_get_sessions_b, rpc_hash_content_b, rpc_send_change_b, rpc_send_change_request_b, rpc_send_folk_lore_b,
  rpc_send_heartbeat_b, rpc_send_sync_request_b, rpc_send_sync_response_b, Signal, StateForSync
} from '@syn-ui/zome-client'
import { AgentPubKey } from '@holochain/conductor-api'

const config = Config.gen()

const dna = path.join(__dirname, '../../syn.dna')

console.log(dna)

const installation:InstallAgentsHapps = [
  // one agents
  [[dna]], // contains 1 dnaT
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
    await s.shareAllNodes([me_player, alice_player, bob_player])

    const me = me_happ.cells[0]
    const alice = alice_happ.cells[0]
    const bob = bob_happ.cells[0]

    const me_pubkey = me.cellId[1]
    const alice_pubkey = alice.cellId[1]
    const alice_pubkey_base64 = bufferToBase64(alice_pubkey)
    const bob_pubkey = bob.cellId[1]
    const bob_pubkey_base64 = bufferToBase64(bob_pubkey)

    let sessions:EntryHash[] = await me.call('syn', 'get_sessions')
    t.equal(sessions.length, 0)
    const me_port:number = parseInt(me_player._conductor.appClient.client.socket.url.split(':')[2])
    const alice_port:number = parseInt(alice_player._conductor.appClient.client.socket.url.split(':')[2])
    const bob_port:number = parseInt(bob_player._conductor.appClient.client.socket.url.split(':')[2])

    const me_ctx = {}, alice_ctx = {}, bob_ctx = {}
    await join_session({ app_port: me_port, app_id: me_happ.hAppId, ctx: me_ctx })
    await join_session({ app_port: alice_port, app_id: alice_happ.hAppId, ctx: alice_ctx })
    await join_session({ app_port: bob_port, app_id: bob_happ.hAppId, ctx: bob_ctx })

    try {
      await subscribe_wait_timeout(session_info_b(me_ctx), I, 10_000)
      // I created the session, so I should be the scribe
      t.deepEqual(session_info_b(me_ctx).$!.scribe, me_pubkey)
      // First ever session so content should be default content
      t.deepEqual(session_info_b(me_ctx).$!.snapshot_content, { title: '', body: '' })
      let sessionHash = session_info_b(me_ctx).$!.session as EntryHash

      // check the hash_content zome call.
      let hash = await rpc_hash_content_b(me_ctx)(session_info_b(me_ctx).$!.snapshot_content)
      t.deepEqual(session_info_b(me_ctx).$!.content_hash, hash)

      // check get_sessions utility zome call
      sessions = await rpc_get_sessions_b(me_ctx)()
      t.equal(sessions.length, 1)
      t.deepEqual(sessions[0], sessionHash)

      // exercise the get_session zome call
      const returnedSessionInfo = await rpc_get_session_b(me_ctx)(sessionHash)
      t.equal(sessions.length, 1)
      t.deepEqual(session_info_b(me_ctx).$, returnedSessionInfo)

      // check that initial snapshot was created by using the get_content zome call
      const returned_content = await rpc_get_content_b(me_ctx)(session_info_b(me_ctx).$!.content_hash)
      t.deepEqual(returned_content, session_info_b(me_ctx).$!.snapshot_content)

      // set up the pending deltas array
      let pending_deltas:Delta[] = [{ type: 'Title', value: 'foo title' }, { type: 'Add', value: [0, 'bar content'] }]

      await apply_deltas_b(me_ctx)(pending_deltas)
      const me_content = content_b(me_ctx)
      const new_content_hash_1 = await rpc_hash_content_b(me_ctx)(me_content.$)

      let deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas

      // set signal handlers so we can confirm they get sent and received appropriately
      let me_signals = writable$<Signal[]>([])
      const me_signals_length = derived$(me_signals, $me_signals=>$me_signals?.length)
      let me_signals_length_$ = me_signals_length.$
      me_player.setSignalHandler((signal)=>{
        console.log('Received Signal for me:', signal)
        me_signals.update($me_signals=>{
          $me_signals.push(signal.data.payload)
          return $me_signals
        })
      })

      // alice signal handler
      const alice_signals = writable$<Signal[]>([])
      const alice_signals_length = derived$(alice_signals, $alice_signals=>$alice_signals?.length)
      let alice_signals_length_$ = alice_signals_length.$
      alice_player.setSignalHandler((signal)=>{
        console.log('Received Signal for alice:', signal)
        alice_signals.update($alice_signals=>{
          $alice_signals.push(signal.data.payload)
          return $alice_signals
        })
      })

      // bob signal handler
      const bob_signals = writable$<Signal[]>([])
      const bob_signals_length = derived$(bob_signals, $bob_signals=>$bob_signals?.length)
      let bob_signals_length_$ = bob_signals_length.$
      bob_player.setSignalHandler((signal)=>{
        console.log('Received Signal for bob:', signal)
        bob_signals.update($bob_signals=>{
          $bob_signals.push(signal.data.payload)
          return $bob_signals
        })
      })

      // add a content change
      let commit:Commit = {
        snapshot: session_info_b(me_ctx).$!.content_hash as EntryHash,
        change: {
          deltas: deltas,
          content_hash: new_content_hash_1,
          previous_change: session_info_b(me_ctx).$!.content_hash as EntryHash, // this is the first change so same hash as snapshot
          meta: {
            contributors: [],
            witnesses: [],
            app_specific: null
          }
        },
        participants: []
      }
      let commit_header_hash = await rpc_commit_b(me_ctx)(commit)
      t.equal(commit_header_hash.length, 39) // is a hash

      // add a second content change
      pending_deltas = [
        { type: 'Delete', value: [0, 3] },
        { type: 'Add', value: [0, 'baz'] },
        { type: 'Add', value: [11, ' new'] },  // 'baz content new'
        { type: 'Delete', value: [4, 11] },    // 'baz  new'
        { type: 'Add', value: [4, 'monkey'] }, // 'baz monkey new'
      ]
      await apply_deltas_b(me_ctx)(pending_deltas)
      const new_content_hash_2 = await rpc_hash_content_b(me_ctx)(me_content.$)

      deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas
      commit = {
        snapshot: session_info_b(me_ctx).$!.content_hash as EntryHash,
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
      commit_header_hash = await rpc_commit_b(me_ctx)(commit)
      // clear the pending_deltas
      pending_deltas = []

      // alice joins session
      const alice_session_info = session_info_b(alice_ctx)
      let alice_session_info_$ = alice_session_info.$
      // alice_session_info.$ = await rpc_get_session_b(alice_ctx)(sessionHash)
      // alice should get my session
      t.deepEqual(alice_session_info.$!.session, sessionHash)
      t.deepEqual(alice_session_info.$!.scribe, me_pubkey)
      t.deepEqual(alice_session_info.$!.snapshot_content, { title: '', body: '' })

      await rpc_send_sync_request_b(alice_ctx)(me_pubkey)

      // check that deltas and snapshot content returned add up to the current real content
      await delay(500) // make time for integrating new data
      const received_deltas:Delta[] = (jsonDeltas ? alice_session_info.$!.deltas.map(d=>JSON.parse(d)) : alice_session_info.$!.deltas) as Delta[]
      await apply_deltas_b(alice_ctx)(received_deltas)
      t.deepEqual(
        me_content.$,
        { title: 'foo title', body: 'baz monkey new', meta: { [my_tag_b(me_ctx).$]: 0 } } // content after two commits
      )

      // confirm that the session_info_b(me_ctx)'s content hash matches the content_hash
      // generated by applying deltas
      hash = await rpc_hash_content_b(alice_ctx)(alice_session_info.$!.snapshot_content as Content)
      t.deepEqual(alice_session_info.$!.content_hash, hash)

      // I should receive alice's request for the state as she joins the session
      t.deepEqual(me_signals.$[0], { signal_name: 'SyncReq', signal_payload: alice_pubkey })

      // I add some pending deltas which I will then need to send to Alice as part of her Joining.
      pending_deltas = [{ type: 'Title', value: 'I haven\'t committed yet' }, { type: 'Add', value: [14, '\nBut made a new line! 🍑'] }]

      deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas

      const state:StateForSync = {
        snapshot: session_info_b(me_ctx).$!.content_hash as EntryHash,
        commit: commit_header_hash,
        commit_content_hash: new_content_hash_2,
        deltas: pending_deltas,
      }
      alice_signals_length_$ = alice_signals_length.$
      await rpc_send_sync_response_b(me_ctx)({
        participant: alice_pubkey,
        state,
      })
      await subscribe_wait_timeout(alice_signals_length, _neq(alice_signals_length_$), 10_000)
      alice_signals_length_$ = alice_signals_length.$

      // Alice should have received uncommitted deltas
      t.equal(alice_signals.$[alice_signals_length_$ - 1].signal_name, 'SyncResp')
      let receivedState = alice_signals.$[alice_signals_length_$ - 1].signal_payload
      t.deepEqual(receivedState, { ...state, deltas: pending_deltas.map(d=>JSON.stringify(d)) }) // deltas, commit, and snapshot match

      // bob joins session
      const bob_$session_info = await rpc_get_session_b(bob_ctx)(sessionHash)
      // bob should get my session
      t.deepEqual(bob_$session_info.scribe, me_pubkey)
      await rpc_send_sync_request_b(bob_ctx)(me_pubkey)

      t.deepEqual(me_signals.$.map(ms=>ms.signal_name), ['SyncReq'])
      // alice sends me a change req and I should receive it
      const alice_delta:Delta = { type: 'Title', value: 'Alice in Wonderland' }
      let delta = jsonDeltas ? JSON.stringify(alice_delta) : alice_delta

      let me_ChangeReq_signals_length = filter_signal_name(me_signals.$, 'ChangeReq').length
      me_signals_length_$ = me_signals_length.$
      await rpc_send_change_request_b(alice_ctx)({
        scribe: alice_session_info.$!.scribe,
        index: 1,
        deltas: [alice_delta]
      })
      await subscribe_wait_timeout(
        me_signals,
        $me_signals=>
          filter_signal_name($me_signals, 'ChangeReq').length > me_ChangeReq_signals_length,
        10_000)
      const sig = filter_signal_name(me_signals.$, 'ChangeReq').reverse()[0]
      t.deepEqual(sig.signal_name, 'ChangeReq')
      const [sig_index, sig_delta] = sig.signal_payload
      t.equal(sig_index, 1)
      const receiveDelta = jsonDeltas ? JSON.parse(sig_delta) : sig_delta
      t.deepEqual(receiveDelta, alice_delta) // delta_matches

      let my_deltas:Delta[] = [{ type: 'Add', value: [0, 'Whoops!\n'] }, { type: 'Title', value: 'Alice in Wonderland' }]
      deltas = jsonDeltas ? my_deltas.map(d=>JSON.stringify(d)) : deltas
      let alice_Change_signals_length = filter_signal_name(alice_signals.$, 'Change').length
      let bob_Change_signals_length = filter_signal_name(bob_signals.$, 'Change').length
      // I send a change, and alice and bob should receive it.
      await rpc_send_change_b(me_ctx)({
        participants: [alice_pubkey, bob_pubkey],
        index: 2,
        deltas: my_deltas,
      })
      await subscribe_wait_timeout(
        alice_signals,
        $alice_signals=>filter_signal_name($alice_signals, 'Change').length > alice_Change_signals_length,
        10_000)
      await subscribe_wait_timeout(
        bob_signals,
        $bob_signals=>filter_signal_name($bob_signals, 'Change').length > bob_Change_signals_length,
        10_000)
      let a_sig = filter_signal_name(alice_signals.$, 'Change').reverse()[0]
      let b_sig = filter_signal_name(bob_signals.$, 'Change').reverse()[0]
      t.equal(a_sig.signal_name, 'Change')
      t.equal(b_sig.signal_name, 'Change')
      t.deepEqual(a_sig.signal_payload, [2, deltas]) // delta_matches
      t.deepEqual(b_sig.signal_payload, [2, deltas]) // delta_matches

      let me_Hearbeat_signal_length = filter_signal_name(me_signals.$, 'Heartbeat').length
      await rpc_send_heartbeat_b(alice_ctx)({
        scribe: me_pubkey,
        data: 'Hello'
      })
      await subscribe_wait_timeout(
        me_signals,
        $me_signals=>filter_signal_name($me_signals, 'Heartbeat').length > me_Hearbeat_signal_length,
        10_000
      )
      let me_sig = filter_signal_name(me_signals.$, 'Heartbeat').reverse()[0]
      t.equal(me_sig.signal_name, 'Heartbeat')
      t.deepEqual(me_sig.signal_payload[1], 'Hello')
      t.deepEqual(me_sig.signal_payload[0], alice_pubkey)

      let alice_FolkLore_length = filter_signal_name(alice_signals.$, 'FolkLore').length
      let bob_FolkLore_length = filter_signal_name(bob_signals.$, 'FolkLore').length
      await rpc_send_folk_lore_b(me_ctx)({
        participants: [alice_pubkey, bob_pubkey],
        data: {
          participants: {
            [alice_pubkey]: {
              pubKey: alice_pubkey
            },
            [bob_pubkey]: {
              pubKey: bob_pubkey
            },
          }
        }
      })
      await subscribe_wait_timeout(
        alice_signals,
        $signals=>filter_signal_name($signals, 'FolkLore').length > alice_FolkLore_length,
        10_000
      )
      await subscribe_wait_timeout(
        bob_signals,
        $signals=>filter_signal_name($signals, 'FolkLore').length > bob_FolkLore_length,
        10_000
      )
      a_sig = filter_signal_name(alice_signals.$, 'FolkLore').reverse()[0]
      b_sig = filter_signal_name(bob_signals.$, 'FolkLore').reverse()[0]
      t.equal(a_sig.signal_name, 'FolkLore')
      t.equal(b_sig.signal_name, 'FolkLore')
      t.deepEqual(a_sig.signal_payload, JSON.stringify({
        participants: {
          [alice_pubkey]: {
            pubKey: alice_pubkey_base64
          },
          [bob_pubkey]: {
            pubKey: bob_pubkey_base64
          },
        }
      }))
      t.deepEqual(b_sig.signal_payload, JSON.stringify({
        participants: {
          [alice_pubkey]: {
            pubKey: alice_pubkey_base64
          },
          [bob_pubkey]: {
            pubKey: bob_pubkey_base64
          },
        }
      }))

      let me_SyncReq_length = filter_signal_name(me_signals.$, 'SyncReq').length
      // alice asks for a sync request
      await rpc_send_sync_request_b(alice_ctx)(me_pubkey)
      await subscribe_wait_timeout(
        me_signals,
        $signals=>filter_signal_name($signals, 'SyncReq').length > me_SyncReq_length,
        10_000
      )
      me_sig = filter_signal_name(me_signals.$, 'SyncReq').reverse()[0]
      t.equal(me_sig.signal_name, 'SyncReq')

      // confirm that all agents got added to the folks anchor
      // TODO figure out why init doesn't happen immediately.
      let folks = await rpc_get_folks_b(me_ctx)()
      t.equal(folks.length, 3)
    } finally {
      await leave_session({ ctx: me_ctx })
      await leave_session({ ctx: alice_ctx })
      await leave_session({ ctx: bob_ctx })
    }
    /**/
  })
}
function filter_signal_name(signals:Signal[], signal_name:string) {
  return signals.filter(s=>s.signal_name === signal_name)
}
