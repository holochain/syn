import { isDeepStrictEqual } from 'util'
import path from 'path'
import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import { noop, promise_timeout } from '@ctx-core/function'
import { assign } from '@ctx-core/object'
import { I } from '@ctx-core/combinators'
import { Readable$, subscribe_wait_timeout, writable$ } from '@ctx-core/store'
import { bufferToBase64, console_b, EntryHash } from '@syn-ui/utils'
import {
    content_b, apply_deltas_b, session_info_b, join_session, leave_session, content_hash_b
} from '@syn-ui/model'
import {
    Commit, Delta, my_tag_b, rpc_commit_b, rpc_get_content_b, rpc_get_folks_b, rpc_get_session_b,
    rpc_get_sessions_b, rpc_hash_content_b, rpc_send_change_b, rpc_send_change_request_b, rpc_send_folk_lore_b,
    rpc_send_heartbeat_b, rpc_send_sync_request_b, rpc_send_sync_response_b, Signal, StateForSync
} from '@syn-ui/zome-client'

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
        // To enable logs, remove log: noop
        const show_full_logs = false
        const console_overrides = show_full_logs ? {} : { log: noop }
        assign(console_b(me_ctx), console_overrides)
        assign(console_b(alice_ctx), console_overrides)
        assign(console_b(bob_ctx), console_overrides)
        await join_session({ app_port: me_port, app_id: me_happ.hAppId, ctx: me_ctx })

        try {
            t.deepEqual(await rpc_get_folks_b(me_ctx)(), [me_pubkey])
            await subscribe_wait_timeout(session_info_b(me_ctx), I, 10_000)
            // I created the session, so I should be the scribe
            t.deepEqual(session_info_b(me_ctx).$!.scribe, me_pubkey)
            // First ever session so content should be default content
            t.deepEqual(session_info_b(me_ctx).$!.snapshot_content, { title: '', body: '' })
            let session_hash = session_info_b(me_ctx).$!.session

            // check the hash_content zome call.
            let content_hash = await rpc_hash_content_b(me_ctx)(session_info_b(me_ctx).$!.snapshot_content)
            t.deepEqual(session_info_b(me_ctx).$!.content_hash, content_hash)

            // check get_sessions utility zome call
            sessions = await rpc_get_sessions_b(me_ctx)()
            t.equal(sessions.length, 1)
            t.deepEqual(sessions[0], session_hash)

            // exercise the get_session zome call
            const session_info = await rpc_get_session_b(me_ctx)(session_hash)
            t.equal(sessions.length, 1)
            t.deepEqual(session_info_b(me_ctx).$, session_info)

            // check that initial snapshot was created by using the get_content zome call
            t.deepEqual(
                session_info_b(me_ctx).$!.snapshot_content,
                await rpc_get_content_b(me_ctx)(session_info_b(me_ctx).$!.content_hash)
            )

            // set up the pending deltas array
            let pending_deltas:Delta[] = [{ type: 'Title', value: 'foo title' }, { type: 'Add', value: [0, 'bar content'] }]

            await apply_deltas_b(me_ctx)(pending_deltas)
            const me_content = content_b(me_ctx)
            content_hash = await rpc_hash_content_b(me_ctx)(me_content.$)

            let deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas

            // set signal handlers so we can confirm they get sent and received appropriately
            let me_signals = writable$<Signal[]>([])
            me_player.setSignalHandler((signal)=>{
                console_b(me_ctx).log('Received Signal for me:', signal)
                me_signals.update($me_signals=>{
                    $me_signals.push(signal.data.payload)
                    return $me_signals
                })
            })

            // alice signal handler
            const alice_signals = writable$<Signal[]>([])
            alice_player.setSignalHandler((signal)=>{
                console_b(alice_ctx).log('Received Signal for alice:', signal)
                alice_signals.update($alice_signals=>{
                    $alice_signals.push(signal.data.payload)
                    return $alice_signals
                })
            })

            // bob signal handler
            const bob_signals = writable$<Signal[]>([])
            bob_player.setSignalHandler((signal)=>{
                console_b(bob_ctx).log('Received Signal for bob:', signal)
                bob_signals.update($bob_signals=>{
                    $bob_signals.push(signal.data.payload)
                    return $bob_signals
                })
            })

            // add a content change
            let commit:Commit = {
                snapshot: session_info_b(me_ctx).$!.content_hash!,
                change: {
                    deltas: deltas,
                    content_hash: content_hash,
                    previous_change: session_info_b(me_ctx).$!.content_hash!, // this is the first change so same content_hash as snapshot
                    meta: {
                        contributors: [],
                        witnesses: [],
                        app_specific: null
                    }
                },
                participants: []
            }
            let commit_header_hash = await rpc_commit_b(me_ctx)(commit)
            t.equal(commit_header_hash.length, 39) // is a content_hash

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
                snapshot: session_info_b(me_ctx).$!.content_hash!,
                change: {
                    deltas,
                    content_hash: new_content_hash_2,
                    previous_change: content_hash, // this is the second change so previous commit's content_hash
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

            // check that deltas and snapshot content returned add up to the current real content
            let me_SyncResp_stack:Signal[], alice_SyncResp_stack:Signal[], me_SyncReq_stack:Signal[]

            // alice joins session
            [alice_SyncResp_stack] = await waitfor_filtered_signals_change(async ()=>{
                    [me_SyncReq_stack] = await waitfor_filtered_signals_change(()=>
                            join_session({
                                app_port: alice_port,
                                app_id: alice_happ.hAppId,
                                ctx: alice_ctx
                            }),
                        // rpc_send_sync_request_b(alice_ctx)(me_pubkey),
                        [me_signals],
                        $signals=>filter_signal_name($signals, 'SyncReq')
                    )
                },
                [alice_signals],
                $signals=>filter_signal_name($signals, 'SyncResp')
            )
            await promise_timeout(async ()=>{
                while (!isDeepStrictEqual(
                    await rpc_get_folks_b(me_ctx)(),
                    [me_pubkey, alice_pubkey])) {}
            }, 500)
            t.deepEqual(await rpc_get_folks_b(me_ctx)(), [me_pubkey, alice_pubkey])
            const alice_session_info = session_info_b(alice_ctx)
            const alice_content = content_b(alice_ctx)
            // alice should get my session
            t.deepEqual(alice_session_info.$!.session, session_hash)
            t.deepEqual(alice_session_info.$!.scribe, me_pubkey)
            t.deepEqual(alice_session_info.$!.snapshot_content, { title: '', body: '' })
            t.deepEqual(
                me_content.$,
                { title: 'foo title', body: 'baz monkey new', meta: { [my_tag_b(me_ctx).$]: 0 } } // content after two commits
            )
            await subscribe_wait_timeout(
                alice_content,
                $alice_content=>
                    isDeepStrictEqual(
                        $alice_content,
                        { title: 'foo title', body: 'baz monkey new', meta: { [my_tag_b(alice_ctx).$]: 0 } }),
                1000
            )
            await leave_session({ ctx: alice_ctx })
            ;[alice_SyncResp_stack] = await waitfor_filtered_signals_change(async ()=>{
                    [me_SyncReq_stack] = await waitfor_filtered_signals_change(()=>
                            join_session({
                                app_port: alice_port,
                                app_id: alice_happ.hAppId,
                                ctx: alice_ctx
                            }),
                        // rpc_send_sync_request_b(alice_ctx)(me_pubkey),
                        [me_signals],
                        $signals=>filter_signal_name($signals, 'SyncReq')
                    )
                },
                [alice_signals],
                $signals=>filter_signal_name($signals, 'SyncResp')
            )
            t.deepEqual(
                alice_content.$,
                { title: 'foo title', body: 'baz monkey new', meta: { [my_tag_b(alice_ctx).$]: 0 } } // content after two commits
            )

            // confirm that the session_info_b(me_ctx)'s content content_hash matches the content_hash
            // generated by applying deltas
            content_hash = await rpc_hash_content_b(alice_ctx)(content_b(alice_ctx).$)
            const alice_content_hash = content_hash_b(alice_ctx)
            t.deepEqual(alice_content_hash.$, content_hash)

            // I should receive alice's request for the state as she joins the session
            t.deepEqual(me_SyncReq_stack![0], { signal_name: 'SyncReq', signal_payload: alice_pubkey })

            // I add some pending deltas which I will then need to send to Alice as part of her Joining.
            pending_deltas = [{ type: 'Title', value: 'I haven\'t committed yet' }, { type: 'Add', value: [14, '\nBut made a new line! 🍑'] }]

            deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas

            const state:StateForSync = {
                snapshot: session_info_b(me_ctx).$!.content_hash!,
                commit: commit_header_hash,
                commit_content_hash: new_content_hash_2,
                deltas: pending_deltas,
            };
            [alice_SyncResp_stack] = await waitfor_filtered_signals_change(async ()=>
                    rpc_send_sync_response_b(me_ctx)({
                        participant: alice_pubkey,
                        state,
                    }),
                [alice_signals],
                $alice_signals=>filter_signal_name($alice_signals, 'SyncResp')
            )

            // Alice should have received uncommitted deltas
            t.equal(alice_SyncResp_stack[0].signal_name, 'SyncResp')
            let receivedState = alice_SyncResp_stack[0].signal_payload
            t.deepEqual(receivedState, { ...state, deltas: pending_deltas.map(d=>JSON.stringify(d)) }) // deltas, commit, and snapshot match

            await join_session({ app_port: bob_port, app_id: bob_happ.hAppId, ctx: bob_ctx })
            // bob joins session
            const bob_$session_info = session_info_b(bob_ctx).$!
            // const bob_$session_info = await rpc_get_session_b(bob_ctx)(session_hash)
            // bob should get my session
            t.deepEqual(bob_$session_info.scribe, me_pubkey)
            await rpc_send_sync_request_b(bob_ctx)(me_pubkey)

            t.deepEqual(me_signals.$.map(ms=>ms.signal_name), ['SyncReq', 'SyncReq', 'SyncReq'])
            // alice sends me a change req and I should receive it
            const alice_delta:Delta = { type: 'Title', value: 'Alice in Wonderland' }
            let delta = jsonDeltas ? JSON.stringify(alice_delta) : alice_delta

            let [me_ChangeReq_stack] = await waitfor_filtered_signals_change(async ()=>
                    rpc_send_change_request_b(alice_ctx)({
                        scribe: alice_session_info.$!.scribe,
                        index: 1,
                        deltas: [alice_delta]
                    }),
                [me_signals],
                $me_signals=>
                    filter_signal_name($me_signals, 'ChangeReq')
            )
            t.deepEqual(me_ChangeReq_stack[0].signal_name, 'ChangeReq')
            const [sig_index, sig_delta] = me_ChangeReq_stack[0].signal_payload
            t.equal(sig_index, 1)
            const receiveDelta = jsonDeltas ? JSON.parse(sig_delta) : sig_delta
            t.deepEqual(receiveDelta, alice_delta) // delta_matches

            let my_deltas:Delta[] = [{ type: 'Add', value: [0, 'Whoops!\n'] }, { type: 'Title', value: 'Alice in Wonderland' }]
            deltas = jsonDeltas ? my_deltas.map(d=>JSON.stringify(d)) : deltas
            // I send a change, and alice and bob should receive it.
            let [alice_Change_stack, bob_Change_stack] = await waitfor_filtered_signals_change(async ()=>
                    rpc_send_change_b(me_ctx)({
                        participants: [alice_pubkey, bob_pubkey],
                        index: 2,
                        deltas: my_deltas,
                    }),
                [alice_signals, bob_signals],
                $signals=>filter_signal_name($signals, 'Change')
            )
            let a_sig = alice_Change_stack[0]
            let b_sig = bob_Change_stack[0]
            t.equal(a_sig.signal_name, 'Change')
            t.equal(b_sig.signal_name, 'Change')
            t.deepEqual(a_sig.signal_payload, [2, deltas]) // delta_matches
            t.deepEqual(b_sig.signal_payload, [2, deltas]) // delta_matches

            let [me_Heartbeat] = await waitfor_filtered_signals_change(async ()=>
                    rpc_send_heartbeat_b(alice_ctx)({
                        scribe: me_pubkey,
                        data: 'Hello'
                    }),
                [me_signals],
                $signals=>filter_signal_name($signals, 'Heartbeat')
            )
            let me_sig = me_Heartbeat[0]
            t.equal(me_sig.signal_name, 'Heartbeat')
            t.deepEqual(me_sig.signal_payload[1], 'Hello')
            t.deepEqual(me_sig.signal_payload[0], alice_pubkey)

            let [alice_FolkLore, bob_FolkLore] = await waitfor_filtered_signals_change(async ()=>
                    rpc_send_folk_lore_b(me_ctx)({
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
                    }),
                [alice_signals, bob_signals],
                $signals=>filter_signal_name($signals, 'FolkLore')
            )
            a_sig = alice_FolkLore[0]
            b_sig = bob_FolkLore[0]
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

            // alice asks for a sync request
            let [me_SyncReq] = await waitfor_filtered_signals_change(async ()=>
                    rpc_send_sync_request_b(alice_ctx)(me_pubkey),
                [me_signals],
                $signals=>filter_signal_name($signals, 'SyncReq')
            )
            me_sig = me_SyncReq[0]
            t.equal(me_sig.signal_name, 'SyncReq')

            // confirm that all agents got added to the folks anchor
            // TODO figure out why init doesn't happen immediately.
            await promise_timeout(async ()=>{
                while (!isDeepStrictEqual(
                    await rpc_get_folks_b(me_ctx)(),
                    [me_pubkey, alice_pubkey, bob_pubkey])) {}
            }, 500)
            /**/
        } finally {
            await leave_session({ ctx: me_ctx })
            await leave_session({ ctx: alice_ctx })
            await leave_session({ ctx: bob_ctx })
        }
        function filter_signal_name($signals:Signal[], signal_name:string) {
            return $signals.filter(s=>s.signal_name === signal_name)
        }
        async function waitfor_filtered_signals_change(
            fn:()=>Promise<any>,
            signals_a1:Readable$<Signal[]>[],
            _filtered_signals:($signals:Signal[])=>Signal[],
            timeout = 1000,
            err = new Error()
        ) {
            const filtered_signals_a1 = signals_a1.map(signals=>_filtered_signals(signals.$))
            await fn()
            try {
                await Promise.all(signals_a1.map((signals, idx)=>
                    subscribe_wait_timeout(signals,
                        $signals=>{
                            return _filtered_signals($signals).length > filtered_signals_a1[idx].length
                        }, timeout)
                ))
                return signals_a1.map(signals=>_filtered_signals(signals.$).reverse())
            } catch (e) {
                err.message = e.message
                throw err
                return []
            }
        }
    })
}
