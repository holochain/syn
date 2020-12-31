import { writable } from 'svelte/store';

export const content = writable({title:"", body:""});
