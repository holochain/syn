import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';

export interface SynGrammar<CONTENT, DELTA> {
  initialState: CONTENT;

  applyDelta: (
    content: CONTENT,
    delta: DELTA,
    author: AgentPubKeyB64
  ) => CONTENT;

}

export type GrammarDelta<G extends SynGrammar<any, any>> = Parameters<
  G['applyDelta']
>[1];
export type GrammarState<G extends SynGrammar<any, any>> =
  G['initialState'];

export type GrammarApplyDeltaFn<G extends SynGrammar<any, any>> =
  G['applyDelta'];
