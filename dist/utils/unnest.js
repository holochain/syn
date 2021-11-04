import { readable } from 'svelte/store';
function noop() { }
export function unnest(store, ...arr) {
    const max = arr.length - 1;
    return readable(null, set => {
        const l = (i) => p => {
            const q = arr[i](p);
            if (!q)
                set(null);
            else
                return i === max ? q.subscribe(set) : subscribe_cleanup(q, l(i + 1));
        };
        return subscribe_cleanup(store, l(0));
    });
}
function subscribe_cleanup(store, run) {
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
//# sourceMappingURL=unnest.js.map