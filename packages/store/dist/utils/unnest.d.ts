import type { Readable } from 'svelte/store';
declare type p<l, r> = (v: l) => Readable<r>;
export declare function unnest<A, B>(store: Readable<A>, ...arr: [p<A, B>]): Readable<B>;
export declare function unnest<A, B, C>(store: Readable<A>, ...arr: [p<A, B>, p<B, C>]): Readable<C>;
export declare function unnest<A, B, C, D>(store: Readable<A>, ...arr: [p<A, B>, p<B, C>, p<C, D>]): Readable<D>;
export declare function unnest<A, B, C, D, E>(store: Readable<A>, ...arr: [p<A, B>, p<B, C>, p<C, D>, p<D, E>]): Readable<E>;
export {};
