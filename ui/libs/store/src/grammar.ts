import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';

export interface SynGrammar<STATE, DELTA, EPHEMERAL = {}> {
  initState: (state: any, ephemeral: any) => void;

  applyDelta: (
    content: STATE,
    delta: DELTA,
    ephemeral: EPHEMERAL,
    author: AgentPubKeyB64
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
