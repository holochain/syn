import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import type { AuthoredDelta } from '@holochain-syn/client';
import { derived, get, Readable, writable, Writable } from 'svelte/store';
import type { GrammarDelta, GrammarState, SynGrammar } from '../grammar';
import type {
  SessionEvent,
  SessionEventListener,
} from '../internal/events/types';
import type { SynSlice } from '../session-store';

export class DebouncingStore<G extends SynGrammar<any, any>>
  implements SynSlice<G>
{
  #localState: Writable<GrammarState<G>>;

  state: Readable<GrammarState<G>>;

  private _deltasNotEmmitted: GrammarDelta<G>[] = [];
  private _conflictingDeltas: GrammarDelta<G>[] = [];

  constructor(
    protected grammar: SynGrammar<any, any>,
    protected myPubKey: AgentPubKeyB64,
    protected synSlice: SynSlice<G>,
    protected debounceMs: number
  ) {
    this.#localState = writable(get(this.synSlice.state));
    this.synSlice.state.subscribe(v => {
      if (this._deltasNotEmmitted.length === 0) {
        this.#localState.set(v);
      }
    });
    const transform = grammar.transformDelta;
    this.synSlice.on('new-remote-delta', delta => {
      console.log('new-remote-delta', delta)
      if (transform && (delta as AuthoredDelta).author !== this.myPubKey) {
        this._conflictingDeltas.push((delta as AuthoredDelta).delta);
      }
    });
    this.state = derived(this.#localState, i => i);

    setInterval(() => this.flush(), debounceMs);
  }

  requestChanges(deltas: Array<GrammarDelta<G>>) {
    for (const delta of deltas) {
      this._deltasNotEmmitted.push(delta);
      this.#localState.update(state =>
        this.grammar.applyDelta(state, delta, this.myPubKey)
      );
    }
  }

  private flush() {
    const conflicting = this._conflictingDeltas;
    console.log('flushing', this._conflictingDeltas, get(this.synSlice.state))
    this._conflictingDeltas = [];
    if (this._deltasNotEmmitted.length > 0) {
      let deltas = this._deltasNotEmmitted;
      
      this._deltasNotEmmitted = [];
      
      const transform = this.grammar.transformDelta;
      if (transform) {
        for (const conflictingDelta of conflicting) {
          deltas = deltas.map(d => transform(d, conflictingDelta));
        }
      }
      
      this.synSlice.requestChanges(deltas);
    }
    this.#localState.set(get(this.synSlice.state));
  }

  on<S extends SessionEvent>(
    event: S['type'],
    listener: SessionEventListener<S>
  ): void {
    this.synSlice.on(event, listener);
  }
}
