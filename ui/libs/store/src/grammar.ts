import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';

export interface SynGrammar<STATE, DELTA> {
  initialState: (stateToInitialize: any) => void;

  applyDelta: (content: STATE, delta: DELTA, author: AgentPubKeyB64) => void;

  selectPersistedState?: (state: STATE) => STATE;
}

export type GrammarDelta<G extends SynGrammar<any, any>> = Parameters<
  G['applyDelta']
>[1];
export type GrammarState<G extends SynGrammar<any, any>> = Parameters<G['applyDelta']>[0];

export type GrammarApplyDeltaFn<G extends SynGrammar<any, any>> =
  G['applyDelta'];
