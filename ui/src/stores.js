import { writable, readable, derived } from 'svelte/store';

export const content = writable({title:"", body:""});

export const pendingDeltas = writable([]);

export const participants = writable({});

export const conn = writable();

export const scribeStr = writable("");
