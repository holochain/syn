import type { AgentPubKey } from '@holochain/client';
export interface SynGrammar<DELTA, STATE, EPHEMERAL = any> {
    initState: (state: STATE) => void;
    applyDelta: (delta: DELTA, content: STATE, ephemeral: EPHEMERAL, author: AgentPubKey) => void;
}
export declare type GrammarDelta<G extends SynGrammar<any, any>> = Parameters<G['applyDelta']>[0];
export declare type GrammarState<G extends SynGrammar<any, any>> = Parameters<G['applyDelta']>[1];
export declare type GrammarEphemeralState<G extends SynGrammar<any, any>> = Parameters<G['applyDelta']>[2];
export declare type GrammarApplyDeltaFn<G extends SynGrammar<any, any>> = G['applyDelta'];
