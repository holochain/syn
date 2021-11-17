import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
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
    if (this._deltasNotEmmitted.length > 0) {
      
      this.synSlice.requestChanges(this._deltasNotEmmitted);

      this._deltasNotEmmitted = [];
    }
  }

  on<S extends SessionEvent>(
    event: S['type'],
    listener: SessionEventListener<S>
  ): void {
    this.synSlice.on(event, listener);
  }
}
