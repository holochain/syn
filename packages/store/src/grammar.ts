import type { AgentPubKey } from '@holochain/client';

export interface SynGrammar<DELTA, STATE, EPHEMERAL = {}> {
  initState: (state: STATE) => void;
  applyDelta: (
    delta: DELTA,
    content: STATE,
    ephemeral: EPHEMERAL,
    author: AgentPubKey
  ) => void;
}

export type GrammarDelta<G extends SynGrammar<any, any>> = Parameters<
  G['applyDelta']
>[0];
export type GrammarState<G extends SynGrammar<any, any>> = Parameters<
  G['applyDelta']
>[1];

export type GrammarEphemeralState<G extends SynGrammar<any, any>> = Parameters<
  G['applyDelta']
>[2];

export type GrammarApplyDeltaFn<G extends SynGrammar<any, any>> =
  G['applyDelta'];
