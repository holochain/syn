import type { Readable } from 'svelte/store';
import { readable } from 'svelte/store';

function noop() {}

type Cleanup = () => void;
type Unsubscriber = () => void;
type CleanupSubscriber<T> = (value: T) => Cleanup | void;

type p<l, r> = (v: l) => Readable<r>;

export function unnest<A, B>(
  store: Readable<A>,
  ...arr: [p<A, B>]
): Readable<B>;
export function unnest<A, B, C>(
  store: Readable<A>,
  ...arr: [p<A, B>, p<B, C>]
): Readable<C>;
export function unnest<A, B, C, D>(
  store: Readable<A>,
  ...arr: [p<A, B>, p<B, C>, p<C, D>]
): Readable<D>;
export function unnest<A, B, C, D, E>(
  store: Readable<A>,
  ...arr: [p<A, B>, p<B, C>, p<C, D>, p<D, E>]
): Readable<E>;
export function unnest(store: Readable<any>, ...arr: p<any, any>[]) {
  const max = arr.length - 1;
  return readable(null, set => {
    const l = (i: number) => p => {
      const q = arr[i](p);
      if (!q) set(null);
      else return i === max ? q.subscribe(set) : subscribe_cleanup(q, l(i + 1));
    };
    return subscribe_cleanup(store, l(0));
  });
}
function subscribe_cleanup<T>(
  store: Readable<T>,
  run: CleanupSubscriber<T>
): Unsubscriber {
  let cleanup = noop;
  const unsub = store.subscribe(v => {
    cleanup();
    cleanup = run(v) || noop;
  });
  return () => {
    cleanup();
    unsub();
  };
}
