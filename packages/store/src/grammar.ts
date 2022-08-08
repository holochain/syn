import type { AgentPubKey } from '@holochain/client';

export interface SynGrammar<STATE, DELTA, EPHEMERAL = {}> {
  applyDelta: (
    content: STATE,
    delta: DELTA,
    ephemeral: EPHEMERAL,
    author: AgentPubKey
  ) => void;
}

export type GrammarDelta<G extends SynGrammar<any, any>> = Parameters<
  G['applyDelta']
>[1];
export type GrammarState<G extends SynGrammar<any, any>> = Parameters<
  G['applyDelta']
>[0];

export type GrammarEphemeralState<G extends SynGrammar<any, any>> = Parameters<
  G['applyDelta']
>[2];

export type GrammarApplyDeltaFn<G extends SynGrammar<any, any>> =
  G['applyDelta'];
