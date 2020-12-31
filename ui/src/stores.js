import { writable } from 'svelte/store';

export const content = writable({title:"", body:""});

export const pendingDeltas = writable([]);

export const participants = writable({});
