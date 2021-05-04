import { isDeepStrictEqual } from 'util'
import path from 'path'
import { Config, InstallAgentsHapps } from '@holochain/tryorama'
import { noop, promise_timeout } from '@ctx-core/function'
import { assign } from '@ctx-core/object'
import { I } from '@ctx-core/combinators'
import { Readable$, subscribe_wait_timeout, writable$ } from '@ctx-core/store'
import { _caller_line, bufferToBase64, console_b } from '@syn-ui/utils'
import {
    content_b, session_info_b, join_session, leave_session, content_hash_b, sessions_b, commit_change_b,
    current_commit_header_hash_b, request_change_b, recorded_changes_b, committed_changes_b, folks_b,
    getFolkColors
} from '@syn-ui/model'
import {
    Delta, my_tag_b, rpc_get_content_b, rpc_get_folks_b, rpc_get_session_b, rpc_hash_content_b,
    rpc_send_heartbeat_b, rpc_send_sync_request_b, Signal
} from '@syn-ui/zome-client'
import { delay } from '@holochain/tryorama/lib/util'

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

        t.equal((await me.call('syn', 'get_sessions')).length, 0, _caller_line())
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
            t.deepEqual(await rpc_get_folks_b(me_ctx)(), [me_pubkey], _caller_line())
            await subscribe_wait_timeout(session_info_b(me_ctx), I, 10_000)
            // I created the session, so I should be the scribe
            t.deepEqual(session_info_b(me_ctx).$!.scribe, me_pubkey, _caller_line())
            // First ever session so content should be default content
            t.deepEqual(session_info_b(me_ctx).$!.snapshot_content, { title: '', body: '' }, _caller_line())
            let session_hash = session_info_b(me_ctx).$!.session

            // check the hash_content zome call.
            t.deepEqual(
                session_info_b(me_ctx).$!.content_hash,
                await rpc_hash_content_b(me_ctx)(session_info_b(me_ctx).$!.snapshot_content),
                _caller_line()
            )

            // check get_sessions utility zome call
            const me_sessions = sessions_b(me_ctx)
            t.equal(me_sessions.$!.length, 1, _caller_line())
            t.deepEqual(me_sessions.$![0], session_hash, _caller_line())

            // exercise the get_session zome call
            t.equal(me_sessions.$!.length, 1, _caller_line())
            t.deepEqual(session_info_b(me_ctx).$, await rpc_get_session_b(me_ctx)(session_hash), _caller_line())

            // check that initial snapshot was created by using the get_content zome call
            t.deepEqual(
                session_info_b(me_ctx).$!.snapshot_content,
                await rpc_get_content_b(me_ctx)(session_info_b(me_ctx).$!.content_hash),
                _caller_line()
            )

            // set up the pending deltas array
            let pending_deltas:Delta[] = [{ type: 'Title', value: 'foo title' }, { type: 'Add', value: [0, 'bar content'] }]

            await request_change_b(me_ctx)(pending_deltas)
            const me_content = content_b(me_ctx)
            let content_hash = await rpc_hash_content_b(me_ctx)(me_content.$)

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
            await commit_change_b(me_ctx)()
            t.equal(current_commit_header_hash_b(me_ctx).$!.length, 39, _caller_line()) // is a content_hash
            t.deepEqual(recorded_changes_b(me_ctx).$, [], _caller_line())

            // add a second content change
            pending_deltas = [
                { type: 'Delete', value: [0, 3] },
                { type: 'Add', value: [0, 'baz'] },
                { type: 'Add', value: [11, ' new'] },  // 'baz content new'
                { type: 'Delete', value: [4, 11] },    // 'baz  new'
                { type: 'Add', value: [4, 'monkey'] }, // 'baz monkey new'
            ]
            const new_content_hash_2 = (await promise_timeout(async ()=>{
                const $current_commit_header_hash = current_commit_header_hash_b(me_ctx).$!
                for (; ;) {
                    if (current_commit_header_hash_b(me_ctx).$! === $current_commit_header_hash) return
                    await delay(0)
                }
            }, 500))!

            deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas
            await request_change_b(me_ctx)(pending_deltas)
            t.deepEqual(recorded_changes_b(me_ctx).$, [
                { delta: { type: 'Delete', value: [0, 3] }, deleted: 'bar' },
                { delta: { type: 'Add', value: [0, 'baz'] } },
                { delta: { type: 'Add', value: [11, ' new'] } },  // 'baz content new'
                { delta: { type: 'Delete', value: [4, 11] }, deleted: 'content' },    // 'baz  new'
                { delta: { type: 'Add', value: [4, 'monkey'] } }, // 'baz monkey new'
            ], _caller_line())

            await commit_change_b(me_ctx)()
            // clear the pending_deltas
            pending_deltas = []

            // check that deltas and snapshot content returned add up to the current real content
            let me_SyncResp_stack:Signal[], alice_SyncResp_stack:Signal[], me_SyncReq_stack:Signal[]

            t.deepEqual(
                me_content.$,
                { title: 'foo title', body: 'baz monkey new', meta: { [my_tag_b(me_ctx).$]: 0 } }, // content after two commits
                _caller_line()
            )
            let alice_FolkLore_stack:Signal[]
                // alice joins session
            ;[
                [me_SyncReq_stack],
                [alice_FolkLore_stack],
                [alice_SyncResp_stack]
            ] = await waitfor_filtered_signals_change(async ()=>
                    join_session({
                        app_port: alice_port,
                        app_id: alice_happ.hAppId,
                        ctx: alice_ctx
                    }),
                [
                    [[me_signals], $signals=>filter_signal_name($signals, 'SyncReq')],
                    [[alice_signals], $signals=>filter_signal_name($signals, 'FolkLore')],
                    [[alice_signals], $signals=>filter_signal_name($signals, 'SyncResp')]
                ]
            )
            await promise_timeout(async ()=>{
                for (; ;) {
                    if (
                        isDeepStrictEqual(await rpc_get_folks_b(me_ctx)(), [me_pubkey, alice_pubkey])
                    ) return
                    await delay(0)
                }
            }, 500)
            await promise_timeout(async ()=>{
                for (; ;) {
                    if (
                        isDeepStrictEqual(
                            await rpc_get_folks_b(alice_ctx)(), [me_pubkey, alice_pubkey])
                    ) return
                    await delay(0)
                }
            }, 500)
            t.deepEqual(await rpc_get_folks_b(me_ctx)(), [me_pubkey, alice_pubkey], _caller_line())
            const alice_session_info = session_info_b(alice_ctx)
            const alice_content = content_b(alice_ctx)
            // alice should get my session
            t.deepEqual(alice_session_info.$!.session, session_hash, _caller_line())
            t.deepEqual(alice_session_info.$!.scribe, me_pubkey, _caller_line())
            t.deepEqual(alice_session_info.$!.snapshot_content, { title: '', body: '' }, _caller_line())
            await promise_timeout(async ()=>{
                for (; ;) {
                    if (
                        isDeepStrictEqual(alice_session_info.$!.deltas, [
                            '{"type":"Title","value":"foo title"}',
                            '{"type":"Add","value":[0,"bar content"]}',
                            '{"type":"Delete","value":[0,3]}',
                            '{"type":"Add","value":[0,"baz"]}',
                            '{"type":"Add","value":[11," new"]}',
                            '{"type":"Delete","value":[4,11]}',
                            '{"type":"Add","value":[4,"monkey"]}'
                        ])
                    ) return
                    await delay(0)
                }
            }, 1000)

            await subscribe_wait_timeout(
                alice_content,
                $alice_content=>{
                    return isDeepStrictEqual(
                        $alice_content,
                        { title: 'foo title', body: 'baz monkey new', meta: { [my_tag_b(alice_ctx).$]: 0 } })
                },
                1000
            )
            await leave_session({ ctx: alice_ctx })
            ;[
                [me_SyncReq_stack],
                [alice_SyncResp_stack],
            ] = await waitfor_filtered_signals_change(async ()=>
                    join_session({
                        app_port: alice_port,
                        app_id: alice_happ.hAppId,
                        ctx: alice_ctx
                    }),
                [
                    [[me_signals], $signals=>filter_signal_name($signals, 'SyncReq')],
                    [[alice_signals], $signals=>filter_signal_name($signals, 'SyncResp')],
                ])
            t.deepEqual(
                alice_content.$,
                { title: 'foo title', body: 'baz monkey new', meta: { [my_tag_b(alice_ctx).$]: 0 } },// content after two commits
                _caller_line()
            )

            // confirm that the session_info_b(me_ctx)'s content content_hash matches the content_hash
            // generated by applying deltas
            content_hash = await rpc_hash_content_b(alice_ctx)(content_b(alice_ctx).$)
            const alice_content_hash = content_hash_b(alice_ctx)
            t.deepEqual(alice_content_hash.$, content_hash, _caller_line())

            // I should receive alice's request for the state as she joins the session
            t.deepEqual(me_SyncReq_stack![0], { signal_name: 'SyncReq', signal_payload: alice_pubkey }, _caller_line())

            // I add some pending deltas which I will then need to send to Alice as part of her Joining.
            pending_deltas = [{ type: 'Title', value: 'I haven\'t committed yet' }, { type: 'Add', value: [14, '\nBut made a new line! 🍑'] }]

            deltas = jsonDeltas ? pending_deltas.map(d=>JSON.stringify(d)) : pending_deltas

            let alice_Change_stack:Signal[]
            let me_index = _index(me_ctx)
            ;[[alice_Change_stack]] = await waitfor_filtered_signals_change(async ()=>
                    request_change_b(me_ctx)(pending_deltas),
                [
                    [[alice_signals], $alice_signals=>filter_signal_name($alice_signals, 'Change')]
                ])

            // Alice should have received uncommitted deltas
            t.equal(alice_Change_stack[0].signal_name, 'Change', _caller_line())
            t.deepEqual(alice_Change_stack[0].signal_payload[0], me_index, _caller_line()) // deltas, commit, and snapshot match
            t.deepEqual(alice_Change_stack[0].signal_payload[1], pending_deltas.map(d=>JSON.stringify(d)), _caller_line()) // deltas, commit, and snapshot match

            t.deepEqual(me_signals.$.map(ms=>ms.signal_name), ['SyncReq', 'SyncReq'], _caller_line())
            // alice sends me a change req and I should receive it
            const alice_delta:Delta = { type: 'Title', value: 'Alice in Wonderland' }
            let delta = jsonDeltas ? JSON.stringify(alice_delta) : alice_delta

            let alice_index = _index(alice_ctx)
            let [[me_ChangeReq_stack]] = await waitfor_filtered_signals_change(async ()=>
                    request_change_b(alice_ctx)([alice_delta]),
                [[[me_signals], $signals=>filter_signal_name($signals, 'ChangeReq')]]
            )
            t.deepEqual(me_ChangeReq_stack[0].signal_name, 'ChangeReq', _caller_line())
            t.equal(me_ChangeReq_stack[0].signal_payload[0], alice_index, _caller_line())
            const receiveDelta = jsonDeltas ? JSON.parse(me_ChangeReq_stack[0].signal_payload[1]) : me_ChangeReq_stack[0].signal_payload[1]
            t.deepEqual(receiveDelta, alice_delta, _caller_line()) // delta_matches

            let alice_SyncReq_stack:Signal[], bob_SyncResp_stack:Signal[], bob_FolkLore_stack:Signal[]
            ;[
                [me_SyncReq_stack],
                [alice_FolkLore_stack, bob_FolkLore_stack],
                [bob_SyncResp_stack]
            ] = await waitfor_filtered_signals_change(async ()=>
                    join_session({
                        app_port: bob_port,
                        app_id: bob_happ.hAppId,
                        ctx: bob_ctx
                    }),
                [
                    [[me_signals], $signals=>filter_signal_name($signals, 'SyncReq')],
                    [[alice_signals, bob_signals], $signals=>filter_signal_name($signals, 'FolkLore')],
                    [[bob_signals], $signals=>filter_signal_name($signals, 'SyncResp')]
                ]
            )

            // bob joins session
            const bob_$session_info = session_info_b(bob_ctx).$!
            // const bob_$session_info = await rpc_get_session_b(bob_ctx)(session_hash)
            // bob should get my session
            t.deepEqual(bob_$session_info.scribe, me_pubkey, _caller_line())
            await promise_timeout(async ()=>{
                for (; ;) {
                    if (
                        isDeepStrictEqual(folks_b(me_ctx).$[alice_pubkey_base64]?.pubKey, alice_pubkey)
                        && isDeepStrictEqual(folks_b(me_ctx).$[bob_pubkey_base64]?.pubKey, bob_pubkey)
                    ) return
                    await delay(0)
                }
            }, 1000)
            await promise_timeout(async ()=>{
                for (; ;) {
                    if (
                        isDeepStrictEqual(folks_b(alice_ctx).$[alice_pubkey_base64]?.pubKey, alice_pubkey)
                        && isDeepStrictEqual(folks_b(alice_ctx).$[bob_pubkey_base64]?.pubKey, bob_pubkey)
                    ) return
                    await delay(0)
                }
            }, 1000)
            await promise_timeout(async ()=>{
                for (; ;) {
                    if (
                        isDeepStrictEqual(folks_b(bob_ctx).$[alice_pubkey_base64]?.pubKey, alice_pubkey)
                        && isDeepStrictEqual(folks_b(bob_ctx).$[bob_pubkey_base64]?.pubKey, bob_pubkey)
                    ) return
                    await delay(0)
                }
            }, 1000)
            t.deepEqual(folks_b(me_ctx).$[alice_pubkey_base64].pubKey, alice_pubkey, _caller_line())
            t.deepEqual(folks_b(me_ctx).$[alice_pubkey_base64].colors, getFolkColors(alice_pubkey), _caller_line())
            t.deepEqual(folks_b(me_ctx).$[alice_pubkey_base64].inSession, true, _caller_line())
            t.ok(folks_b(me_ctx).$[alice_pubkey_base64].lastSeen! <= Date.now(), _caller_line())
            t.deepEqual(folks_b(me_ctx).$[bob_pubkey_base64].pubKey, bob_pubkey, _caller_line())
            t.deepEqual(folks_b(me_ctx).$[bob_pubkey_base64].colors, getFolkColors(bob_pubkey), _caller_line())
            t.deepEqual(folks_b(me_ctx).$[bob_pubkey_base64].inSession, true, _caller_line())
            t.ok(folks_b(me_ctx).$[bob_pubkey_base64].lastSeen! <= Date.now(), _caller_line())
            t.deepEqual(folks_b(alice_ctx).$[alice_pubkey_base64].pubKey, alice_pubkey, _caller_line())
            t.deepEqual(folks_b(alice_ctx).$[alice_pubkey_base64].colors, getFolkColors(alice_pubkey), _caller_line())
            t.deepEqual(folks_b(alice_ctx).$[bob_pubkey_base64].pubKey, bob_pubkey, _caller_line())
            t.deepEqual(folks_b(alice_ctx).$[bob_pubkey_base64].colors, getFolkColors(bob_pubkey), _caller_line())
            t.deepEqual(folks_b(bob_ctx).$[alice_pubkey_base64].pubKey, alice_pubkey, _caller_line())
            t.deepEqual(folks_b(bob_ctx).$[alice_pubkey_base64].colors, getFolkColors(alice_pubkey), _caller_line())
            t.deepEqual(folks_b(bob_ctx).$[bob_pubkey_base64].pubKey, bob_pubkey, _caller_line())
            t.deepEqual(folks_b(bob_ctx).$[bob_pubkey_base64].colors, getFolkColors(bob_pubkey), _caller_line())

            t.equal(alice_FolkLore_stack[0].signal_name, 'FolkLore', _caller_line())
            t.equal(bob_FolkLore_stack[0].signal_name, 'FolkLore', _caller_line())
            ;(()=>{
                const alice_signal = JSON.parse(alice_FolkLore_stack[0].signal_payload)
                t.deepEqual(alice_signal.participants[alice_pubkey_base64].pubKey, alice_pubkey_base64, _caller_line())
                t.deepEqual(alice_signal.participants[bob_pubkey_base64].pubKey, bob_pubkey_base64, _caller_line())
            })()
            ;(()=>{
                const bob_signal = JSON.parse(bob_FolkLore_stack[0].signal_payload)
                t.deepEqual(bob_signal.participants[alice_pubkey_base64].pubKey, alice_pubkey_base64, _caller_line())
                t.deepEqual(bob_signal.participants[bob_pubkey_base64].pubKey, bob_pubkey_base64, _caller_line())
            })()

            let my_deltas:Delta[] = [{ type: 'Add', value: [0, 'Whoops!\n'] }, { type: 'Title', value: 'Alice in Wonderland' }]
            deltas = jsonDeltas ? my_deltas.map(d=>JSON.stringify(d)) : deltas
            let bob_Change_stack:Signal[]
            // I send a change, and alice and bob should receive it.
            me_index = _index(me_ctx)
            ;[[alice_Change_stack, bob_Change_stack]] = await waitfor_filtered_signals_change(async ()=>
                    request_change_b(me_ctx)(my_deltas),
                [
                    [[alice_signals, bob_signals], $signals=>filter_signal_name($signals, 'Change')]
                ]
            )
            t.equal(alice_Change_stack[0].signal_name, 'Change', _caller_line())
            t.equal(bob_Change_stack[0].signal_name, 'Change', _caller_line())
            t.deepEqual(alice_Change_stack[0].signal_payload[0], me_index, _caller_line()) // delta_matches
            t.deepEqual(alice_Change_stack[0].signal_payload[1], deltas, _caller_line()) // delta_matches
            t.deepEqual(bob_Change_stack[0].signal_payload[0], me_index, _caller_line()) // delta_matches
            t.deepEqual(bob_Change_stack[0].signal_payload[1], deltas, _caller_line()) // delta_matches

            let me_Heartbeat:Signal[]
            ;[[me_Heartbeat]] = await waitfor_filtered_signals_change(async ()=>
                    rpc_send_heartbeat_b(alice_ctx)({
                        scribe: me_pubkey,
                        data: 'Hello'
                    }),
                [[[me_signals], $signals=>filter_signal_name($signals, 'Heartbeat')]]
            )
            let me_sig = me_Heartbeat[0]
            t.equal(me_sig.signal_name, 'Heartbeat', _caller_line())
            t.deepEqual(me_sig.signal_payload[1], 'Hello', _caller_line())
            t.deepEqual(me_sig.signal_payload[0], alice_pubkey, _caller_line())

            // alice asks for a sync request
            let me_SyncReq:Signal[]
            ;[[me_SyncReq]] = await waitfor_filtered_signals_change(async ()=>
                    rpc_send_sync_request_b(alice_ctx)(me_pubkey),
                [[[me_signals], $signals=>filter_signal_name($signals, 'SyncReq')]]
            )
            t.equal(me_SyncReq[0].signal_name, 'SyncReq', _caller_line())

            // confirm that all agents got added to the folks anchor
            // TODO figure out why init doesn't happen immediately.
            await promise_timeout(async ()=>{
                for (; ;) {
                    if (
                        isDeepStrictEqual(
                            await rpc_get_folks_b(me_ctx)(),
                            [me_pubkey, alice_pubkey, bob_pubkey])
                    ) return
                    await delay(0)
                }
            }, 500)
            /**/
        } finally {
            console.debug('finally|leave_session')
            await leave_session({ ctx: me_ctx })
            await leave_session({ ctx: alice_ctx })
            await leave_session({ ctx: bob_ctx })
        }
        function filter_signal_name($signals:Signal[], signal_name:string) {
            return $signals.filter(s=>s.signal_name === signal_name)
        }
        function _index(ctx) {
            return committed_changes_b(ctx).$.length + recorded_changes_b(ctx).$.length
        }
        async function waitfor_filtered_signals_change(
            fn:()=>Promise<any>,
            script_a1:[Readable$<Signal[]>[], ($signals:Signal[])=>Signal[]][],
            timeout = 1000,
            err = new Error()
        ) {
            const filtered_signals_a2 = script_a1.map(script=>{
                const [signals_a1, _filtered_signals] = script
                return signals_a1.map(signals=>_filtered_signals(signals.$))
            })
            await fn()
            return await Promise.all(
                script_a1.map(async (script, script_idx)=>{
                    try {
                        const [signals_a1, _filtered_signals] = script
                        await Promise.all(signals_a1.map((signals, idx)=>
                            subscribe_wait_timeout(signals,
                                $signals=>{
                                    return _filtered_signals($signals).length > filtered_signals_a2[script_idx][idx].length
                                }, timeout)
                        ))
                        return signals_a1.map(signals=>_filtered_signals(signals.$).reverse())
                    } catch (e) {
                        err.message = e.message
                        throw err
                    }
                })
            )
        }
    })
}
