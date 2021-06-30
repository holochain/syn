
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const bufferToBase64 = buffer => {
      if (typeof window !== "undefined") {
        // browser
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary)
      } else {
        // nodejs
        return buffer.toString('base64')
      }
    };

    const base64ToBuffer = base64 => {
      if (typeof window !== "undefined") {
        return Uint8Array.from(window.atob(base64), c => c.charCodeAt(0))
      } else {
        return Buffer.from(base64, 'base64');
      }
    };

    function decodeJson(jsonStr) {
      return JSON.parse( jsonStr, function( key, value ){
        // the receiver function looks for the typed array flag
        try{
          if (key == "pubKey") {
            return base64ToBuffer(value)
          }
        }catch(e){
          console.log("decodeJson Error:", e);
        }

        // if flag not found no conversion is done
        return value
      })
    }

    function encodeJson(obj) {
      return JSON.stringify( obj , function( key, value ){
        if (key == "pubKey") {
          if (typeof window !== "undefined") {
            return bufferToBase64(value) // In the browser it's the actual array
          } else {
            return bufferToBase64(Buffer.from(value.data)) // In node it's an object
          }
        }
        return value
      })
    }

    const emptySession = { title: '', body: '' };

    const session = writable();

    const content = writable({ ...emptySession });

    const folks = writable({});

    const connection = writable();

    const scribeStr = writable('');

    const requestedChanges = writable([]);

    const recordedChanges = writable([]);

    const committedChanges = writable([]);

    const nextIndex = derived(
      recordedChanges,
      c => c.length
    );

    /* src/StickyEditor.svelte generated by Svelte v3.31.0 */

    const file = "src/StickyEditor.svelte";

    // (43:4) {#if handleDelete}
    function create_if_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Delete";
    			attr_dev(button, "class", "svelte-1xk9ozv");
    			add_location(button, file, 43, 6, 892);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*handleDelete*/ ctx[2])) /*handleDelete*/ ctx[2].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(43:4) {#if handleDelete}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let textarea;
    	let t0;
    	let div0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let mounted;
    	let dispose;
    	let if_block = /*handleDelete*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			textarea = element("textarea");
    			t0 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Save";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Cancel";
    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(textarea, "class", "textarea svelte-1xk9ozv");
    			add_location(textarea, file, 38, 2, 680);
    			attr_dev(button0, "class", "svelte-1xk9ozv");
    			add_location(button0, file, 40, 4, 757);
    			attr_dev(button1, "class", "svelte-1xk9ozv");
    			add_location(button1, file, 41, 4, 817);
    			attr_dev(div0, "class", "controls svelte-1xk9ozv");
    			add_location(div0, file, 39, 2, 730);
    			attr_dev(div1, "class", "sticky-editor svelte-1xk9ozv");
    			add_location(div1, file, 37, 0, 650);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*text*/ ctx[0]);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(div0, t4);
    			if (if_block) if_block.m(div0, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[4]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*cancelEdit*/ ctx[3])) /*cancelEdit*/ ctx[3].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*text*/ 1) {
    				set_input_value(textarea, /*text*/ ctx[0]);
    			}

    			if (/*handleDelete*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StickyEditor", slots, []);
    	let { handleSave } = $$props;
    	let { handleDelete = undefined } = $$props;
    	let { cancelEdit } = $$props;
    	let { text = "" } = $$props;
    	const writable_props = ["handleSave", "handleDelete", "cancelEdit", "text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StickyEditor> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		text = this.value;
    		$$invalidate(0, text);
    	}

    	const click_handler = () => handleSave(text);

    	$$self.$$set = $$props => {
    		if ("handleSave" in $$props) $$invalidate(1, handleSave = $$props.handleSave);
    		if ("handleDelete" in $$props) $$invalidate(2, handleDelete = $$props.handleDelete);
    		if ("cancelEdit" in $$props) $$invalidate(3, cancelEdit = $$props.cancelEdit);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({
    		handleSave,
    		handleDelete,
    		cancelEdit,
    		text
    	});

    	$$self.$inject_state = $$props => {
    		if ("handleSave" in $$props) $$invalidate(1, handleSave = $$props.handleSave);
    		if ("handleDelete" in $$props) $$invalidate(2, handleDelete = $$props.handleDelete);
    		if ("cancelEdit" in $$props) $$invalidate(3, cancelEdit = $$props.cancelEdit);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		text,
    		handleSave,
    		handleDelete,
    		cancelEdit,
    		textarea_input_handler,
    		click_handler
    	];
    }

    class StickyEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			handleSave: 1,
    			handleDelete: 2,
    			cancelEdit: 3,
    			text: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StickyEditor",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*handleSave*/ ctx[1] === undefined && !("handleSave" in props)) {
    			console.warn("<StickyEditor> was created without expected prop 'handleSave'");
    		}

    		if (/*cancelEdit*/ ctx[3] === undefined && !("cancelEdit" in props)) {
    			console.warn("<StickyEditor> was created without expected prop 'cancelEdit'");
    		}
    	}

    	get handleSave() {
    		throw new Error("<StickyEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleSave(value) {
    		throw new Error("<StickyEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleDelete() {
    		throw new Error("<StickyEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleDelete(value) {
    		throw new Error("<StickyEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cancelEdit() {
    		throw new Error("<StickyEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cancelEdit(value) {
    		throw new Error("<StickyEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<StickyEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<StickyEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    var getRandomValues;
    var rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
        // find the complete implementation of crypto (msCrypto) on IE11.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

    function validate(uuid) {
      return typeof uuid === 'string' && REGEX.test(uuid);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    var byteToHex = [];

    for (var i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).substr(1));
    }

    function stringify(arr) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
      // of the following:
      // - One or more input array values don't map to a hex octet (leading to
      // "undefined" in the uuid)
      // - Invalid input values for the RFC `version` or `variant` fields

      if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
      }

      return uuid;
    }

    //
    // Inspired by https://github.com/LiosK/UUID.js
    // and http://docs.python.org/library/uuid.html

    var _nodeId;

    var _clockseq; // Previous uuid creation time


    var _lastMSecs = 0;
    var _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

    function v1(options, buf, offset) {
      var i = buf && offset || 0;
      var b = buf || new Array(16);
      options = options || {};
      var node = options.node || _nodeId;
      var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
      // specified.  We do this lazily to minimize issues related to insufficient
      // system entropy.  See #189

      if (node == null || clockseq == null) {
        var seedBytes = options.random || (options.rng || rng)();

        if (node == null) {
          // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
          node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
        }

        if (clockseq == null) {
          // Per 4.2.2, randomize (14 bit) clockseq
          clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
        }
      } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
      // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
      // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
      // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


      var msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
      // cycle to simulate higher resolution clock

      var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

      var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

      if (dt < 0 && options.clockseq === undefined) {
        clockseq = clockseq + 1 & 0x3fff;
      } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
      // time interval


      if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
        nsecs = 0;
      } // Per 4.2.1.2 Throw error if too many uuids are requested


      if (nsecs >= 10000) {
        throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
      }

      _lastMSecs = msecs;
      _lastNSecs = nsecs;
      _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

      msecs += 12219292800000; // `time_low`

      var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
      b[i++] = tl >>> 24 & 0xff;
      b[i++] = tl >>> 16 & 0xff;
      b[i++] = tl >>> 8 & 0xff;
      b[i++] = tl & 0xff; // `time_mid`

      var tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
      b[i++] = tmh >>> 8 & 0xff;
      b[i++] = tmh & 0xff; // `time_high_and_version`

      b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

      b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

      b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

      b[i++] = clockseq & 0xff; // `node`

      for (var n = 0; n < 6; ++n) {
        b[i + n] = node[n];
      }

      return buf || stringify(b);
    }

    /* src/Board.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/Board.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i].id;
    	child_ctx[12] = list[i].text;
    	return child_ctx;
    }

    // (84:4) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let t_value = /*text*/ ctx[12] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "sticky svelte-1hech55");
    			add_location(div, file$1, 84, 6, 1782);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					div,
    					"click",
    					function () {
    						if (is_function(/*editSticky*/ ctx[4](/*id*/ ctx[11]))) /*editSticky*/ ctx[4](/*id*/ ctx[11]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*stickies*/ 4 && t_value !== (t_value = /*text*/ ctx[12] + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(84:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:4) {#if editingStickyId === id}
    function create_if_block_1(ctx) {
    	let stickyeditor;
    	let current;

    	stickyeditor = new StickyEditor({
    			props: {
    				handleSave: /*updateSticky*/ ctx[7](/*id*/ ctx[11]),
    				handleDelete: /*deleteSticky*/ ctx[6](/*id*/ ctx[11]),
    				cancelEdit: /*cancelEdit*/ ctx[8],
    				text: /*text*/ ctx[12]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(stickyeditor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stickyeditor, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const stickyeditor_changes = {};
    			if (dirty & /*stickies*/ 4) stickyeditor_changes.handleSave = /*updateSticky*/ ctx[7](/*id*/ ctx[11]);
    			if (dirty & /*stickies*/ 4) stickyeditor_changes.handleDelete = /*deleteSticky*/ ctx[6](/*id*/ ctx[11]);
    			if (dirty & /*stickies*/ 4) stickyeditor_changes.text = /*text*/ ctx[12];
    			stickyeditor.$set(stickyeditor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stickyeditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stickyeditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(stickyeditor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(82:4) {#if editingStickyId === id}",
    		ctx
    	});

    	return block;
    }

    // (81:2) {#each stickies as { id, text}
    function create_each_block(key_1, ctx) {
    	let first;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*editingStickyId*/ ctx[1] === /*id*/ ctx[11]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(81:2) {#each stickies as { id, text}",
    		ctx
    	});

    	return block;
    }

    // (90:2) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "+ Add";
    			attr_dev(button, "class", "add svelte-1hech55");
    			add_location(button, file$1, 90, 4, 1949);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*newSticky*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(90:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (88:2) {#if creating}
    function create_if_block$1(ctx) {
    	let stickyeditor;
    	let current;

    	stickyeditor = new StickyEditor({
    			props: {
    				handleSave: /*addSticky*/ ctx[5],
    				cancelEdit: /*cancelEdit*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(stickyeditor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stickyeditor, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stickyeditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stickyeditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(stickyeditor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(88:2) {#if creating}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let each_value = /*stickies*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*id*/ ctx[11];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*creating*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if_block.c();
    			attr_dev(div, "class", "board svelte-1hech55");
    			add_location(div, file$1, 79, 0, 1567);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*updateSticky, stickies, deleteSticky, cancelEdit, editingStickyId, editSticky*/ 470) {
    				const each_value = /*stickies*/ ctx[2];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, t, get_each_context);
    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $content;
    	validate_store(content, "content");
    	component_subscribe($$self, content, $$value => $$invalidate(9, $content = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Board", slots, []);
    	const dispatch = createEventDispatcher();
    	let creating = false;

    	const newSticky = () => {
    		$$invalidate(0, creating = true);
    	};

    	let editingStickyId;

    	const editSticky = id => () => {
    		$$invalidate(1, editingStickyId = id);
    	};

    	const addSticky = text => {
    		dispatch("requestChange", [
    			{
    				type: "add-sticky",
    				value: { id: v1(), text }
    			}
    		]);

    		$$invalidate(0, creating = false);
    	};

    	const deleteSticky = id => () => {
    		dispatch("requestChange", [{ type: "delete-sticky", value: { id } }]);
    		$$invalidate(1, editingStickyId = null);
    	};

    	const updateSticky = id => text => {
    		dispatch("requestChange", [
    			{
    				type: "update-sticky",
    				value: { id, text }
    			}
    		]);

    		$$invalidate(1, editingStickyId = null);
    	};

    	const cancelEdit = () => {
    		$$invalidate(0, creating = false);
    		$$invalidate(1, editingStickyId = null);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Board> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		content,
    		StickyEditor,
    		uuidv1: v1,
    		dispatch,
    		creating,
    		newSticky,
    		editingStickyId,
    		editSticky,
    		addSticky,
    		deleteSticky,
    		updateSticky,
    		cancelEdit,
    		stickies,
    		$content
    	});

    	$$self.$inject_state = $$props => {
    		if ("creating" in $$props) $$invalidate(0, creating = $$props.creating);
    		if ("editingStickyId" in $$props) $$invalidate(1, editingStickyId = $$props.editingStickyId);
    		if ("stickies" in $$props) $$invalidate(2, stickies = $$props.stickies);
    	};

    	let stickies;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$content*/ 512) {
    			 $$invalidate(2, stickies = $content.body.length === 0
    			? []
    			: JSON.parse($content.body));
    		}
    	};

    	return [
    		creating,
    		editingStickyId,
    		stickies,
    		newSticky,
    		editSticky,
    		addSticky,
    		deleteSticky,
    		updateSticky,
    		cancelEdit,
    		$content
    	];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    // retruns binary input as hex number string (e.g. 'a293b8e1a')
    function arrayBufferToHex(buffer){
      let hexString = '';
      for (const byte of buffer) {
        hexString += byte.toString(16);
      }
      return hexString
    }

    // converts RGB to HSL
    // Source: https://gist.github.com/mjackson/5311256
    function rgbToHsl(r, g, b) {
      r /= 255, g /= 255, b /= 255;
      let max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2;
      if (max == min) { h = s = 0;} else {
          let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch(max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
          } h /= 6; } return [h*360, s*100, l*100];}

    // Source: https://stackoverflow.com/questions/5842747
    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max)
    }

    // Generate an object of colors for a folk from their pubKey
    // returns Object:
    //           primary: Color,            // used for hex outline and norrmal cursor
    //           hexagon: Color,            // used for hexagon picture placeholder
    //           selection: Color,          // used for normal selection
    //           lookingSelection: Color,   // used for selection when "looking at"
    //           lookingCursor: Color,      // used for cursor when "looking at"
    // where Color is array: [h, s, l]
    // used in `use:setColor` on new Folk components
    function getFolkColors(pubKey) {
      // get a hex color from the folk's public key
      const hexColor = '#' + arrayBufferToHex(pubKey).slice(-6);
      // extract the RGB components from the hex color notation.
      // Source: https://stackoverflow.com/questions/3732046
      const r = parseInt(hexColor.substr(1,2), 16); // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
      const g = parseInt(hexColor.substr(3,2), 16);
      const b = parseInt(hexColor.substr(5,2), 16);
      // convert to HSL
      let hsl = rgbToHsl(r, g, b);
      // limit color to be bright enough and not too bright
      hsl[1] = clamp(hsl[1], 10, 90); // limit s
      const [h,s,l] = hsl; // destructure
      return {
                 primary: [h, s, 50],
                 hexagon: [h, s, 25],
               selection: [h, s, 90], // placeholder values from here down
        lookingSelection: [h, s, 80],
           lookingCursor: [h, s+10, 40],
      }
    }

    function CSSifyHSL(hslArray) {
      const [h,s,l] = hslArray;
      return `hsl(${h} ${s}% ${l}%)`
    }

    /* src/Folk.svelte generated by Svelte v3.31.0 */
    const file$2 = "src/Folk.svelte";

    // (82:0) {#if $connection && $connection.syn}
    function create_if_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*scribe*/ ctx[2]) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(82:0) {#if $connection && $connection.syn}",
    		ctx
    	});

    	return block;
    }

    // (91:2) {:else}
    function create_else_block$1(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = /*pubKeyStr*/ ctx[0].slice(-4) + "";
    	let t1;
    	let setUpHex_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			t1 = text(t1_value);
    			attr_dev(div0, "class", "folk-color svelte-e1mrh0");
    			add_location(div0, file$2, 92, 6, 3061);
    			attr_dev(div1, "class", "folk svelte-e1mrh0");
    			toggle_class(div1, "me", /*me*/ ctx[1]);
    			toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[3]);
    			add_location(div1, file$2, 91, 4, 2978);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = action_destroyer(setUpHex_action = /*setUpHex*/ ctx[5].call(null, div1));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pubKeyStr*/ 1 && t1_value !== (t1_value = /*pubKeyStr*/ ctx[0].slice(-4) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*me*/ 2) {
    				toggle_class(div1, "me", /*me*/ ctx[1]);
    			}

    			if (dirty & /*outOfSession*/ 8) {
    				toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(91:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:2) {#if scribe}
    function create_if_block_1$1(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = /*pubKeyStr*/ ctx[0].slice(-4) + "";
    	let t1;
    	let setUpHex_action;
    	let t2;
    	let div2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "folk-color svelte-e1mrh0");
    			add_location(div0, file$2, 85, 8, 2841);
    			attr_dev(div1, "class", "folk scribe svelte-e1mrh0");
    			toggle_class(div1, "me", /*me*/ ctx[1]);
    			toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[3]);
    			add_location(div1, file$2, 84, 6, 2749);
    			attr_dev(div2, "class", "scribe-halo svelte-e1mrh0");
    			add_location(div2, file$2, 88, 6, 2921);
    			attr_dev(div3, "class", "scribe-wrapper svelte-e1mrh0");
    			add_location(div3, file$2, 83, 4, 2714);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			if (!mounted) {
    				dispose = action_destroyer(setUpHex_action = /*setUpHex*/ ctx[5].call(null, div1));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pubKeyStr*/ 1 && t1_value !== (t1_value = /*pubKeyStr*/ ctx[0].slice(-4) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*me*/ 2) {
    				toggle_class(div1, "me", /*me*/ ctx[1]);
    			}

    			if (dirty & /*outOfSession*/ 8) {
    				toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(83:2) {#if scribe}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*$connection*/ ctx[4] && /*$connection*/ ctx[4].syn && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$connection*/ ctx[4] && /*$connection*/ ctx[4].syn) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $scribeStr;
    	let $folks;
    	let $connection;
    	validate_store(scribeStr, "scribeStr");
    	component_subscribe($$self, scribeStr, $$value => $$invalidate(7, $scribeStr = $$value));
    	validate_store(folks, "folks");
    	component_subscribe($$self, folks, $$value => $$invalidate(8, $folks = $$value));
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, $$value => $$invalidate(4, $connection = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Folk", slots, []);
    	let { pubKeyStr = "" } = $$props;
    	let { pubKey } = $$props;
    	let { me = false } = $$props;

    	function setUpHex(hexEl) {
    		let colors;

    		if (me) {
    			colors = $connection.syn.myColors;
    		} else {
    			colors = $folks[pubKeyStr].colors;
    		}

    		hexEl.style["background-color"] = CSSifyHSL(colors.primary);

    		// hex element's first child is its picture/hexagonColor div
    		hexEl.firstChild.style["background-color"] = CSSifyHSL(colors.hexagon);
    	}

    	const writable_props = ["pubKeyStr", "pubKey", "me"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Folk> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("pubKeyStr" in $$props) $$invalidate(0, pubKeyStr = $$props.pubKeyStr);
    		if ("pubKey" in $$props) $$invalidate(6, pubKey = $$props.pubKey);
    		if ("me" in $$props) $$invalidate(1, me = $$props.me);
    	};

    	$$self.$capture_state = () => ({
    		scribeStr,
    		folks,
    		connection,
    		CSSifyHSL,
    		pubKeyStr,
    		pubKey,
    		me,
    		setUpHex,
    		scribe,
    		$scribeStr,
    		outOfSession,
    		$folks,
    		$connection
    	});

    	$$self.$inject_state = $$props => {
    		if ("pubKeyStr" in $$props) $$invalidate(0, pubKeyStr = $$props.pubKeyStr);
    		if ("pubKey" in $$props) $$invalidate(6, pubKey = $$props.pubKey);
    		if ("me" in $$props) $$invalidate(1, me = $$props.me);
    		if ("scribe" in $$props) $$invalidate(2, scribe = $$props.scribe);
    		if ("outOfSession" in $$props) $$invalidate(3, outOfSession = $$props.outOfSession);
    	};

    	let scribe;
    	let outOfSession;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pubKeyStr, $scribeStr*/ 129) {
    			 $$invalidate(2, scribe = pubKeyStr == $scribeStr);
    		}

    		if ($$self.$$.dirty & /*$folks, pubKeyStr, me*/ 259) {
    			 $$invalidate(3, outOfSession = (!$folks[pubKeyStr] || !$folks[pubKeyStr].inSession) && !me);
    		}
    	};

    	return [
    		pubKeyStr,
    		me,
    		scribe,
    		outOfSession,
    		$connection,
    		setUpHex,
    		pubKey,
    		$scribeStr,
    		$folks
    	];
    }

    class Folk extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { pubKeyStr: 0, pubKey: 6, me: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Folk",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pubKey*/ ctx[6] === undefined && !("pubKey" in props)) {
    			console.warn("<Folk> was created without expected prop 'pubKey'");
    		}
    	}

    	get pubKeyStr() {
    		throw new Error("<Folk>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pubKeyStr(value) {
    		throw new Error("<Folk>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pubKey() {
    		throw new Error("<Folk>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pubKey(value) {
    		throw new Error("<Folk>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get me() {
    		throw new Error("<Folk>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set me(value) {
    		throw new Error("<Folk>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Folks.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/Folks.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (18:2) {#if $connection && $connection.syn && $connection.syn.me}
    function create_if_block$3(ctx) {
    	let folk;
    	let current;

    	folk = new Folk({
    			props: {
    				me: true,
    				pubKeyStr: /*$connection*/ ctx[0].syn.me,
    				pubKey: /*$connection*/ ctx[0].syn.agentPubKey
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(folk.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(folk, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const folk_changes = {};
    			if (dirty & /*$connection*/ 1) folk_changes.pubKeyStr = /*$connection*/ ctx[0].syn.me;
    			if (dirty & /*$connection*/ 1) folk_changes.pubKey = /*$connection*/ ctx[0].syn.agentPubKey;
    			folk.$set(folk_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(folk.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(folk.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(folk, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(18:2) {#if $connection && $connection.syn && $connection.syn.me}",
    		ctx
    	});

    	return block;
    }

    // (21:2) {#each Object.keys($folks) as p}
    function create_each_block$1(ctx) {
    	let folk;
    	let current;

    	folk = new Folk({
    			props: {
    				pubKeyStr: /*p*/ ctx[2],
    				pubKey: /*$folks*/ ctx[1][/*p*/ ctx[2]].pubKey
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(folk.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(folk, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const folk_changes = {};
    			if (dirty & /*$folks*/ 2) folk_changes.pubKeyStr = /*p*/ ctx[2];
    			if (dirty & /*$folks*/ 2) folk_changes.pubKey = /*$folks*/ ctx[1][/*p*/ ctx[2]].pubKey;
    			folk.$set(folk_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(folk.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(folk.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(folk, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(21:2) {#each Object.keys($folks) as p}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let current;
    	let if_block = /*$connection*/ ctx[0] && /*$connection*/ ctx[0].syn && /*$connection*/ ctx[0].syn.me && create_if_block$3(ctx);
    	let each_value = Object.keys(/*$folks*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "folks svelte-nxelj2");
    			add_location(div, file$3, 16, 0, 386);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$connection*/ ctx[0] && /*$connection*/ ctx[0].syn && /*$connection*/ ctx[0].syn.me) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$connection*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*Object, $folks*/ 2) {
    				each_value = Object.keys(/*$folks*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $connection;
    	let $folks;
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, $$value => $$invalidate(0, $connection = $$value));
    	validate_store(folks, "folks");
    	component_subscribe($$self, folks, $$value => $$invalidate(1, $folks = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Folks", slots, []);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Folks> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		folks,
    		connection,
    		scribeStr,
    		Folk,
    		$connection,
    		$folks
    	});

    	return [$connection, $folks];
    }

    class Folks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Folks",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var admin = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    });

    var app = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    });

    var types = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fakeAgentPubKey = void 0;
    exports.fakeAgentPubKey = (x) => Buffer.from([0x84, 0x20, 0x24].concat('000000000000000000000000000000000000'
        .split('')
        .map((x) => parseInt(x, 10))));

    });

    // https://github.com/maxogden/websocket-stream/blob/48dc3ddf943e5ada668c31ccd94e9186f02fafbd/ws-fallback.js

    var ws = null;

    if (typeof WebSocket !== 'undefined') {
      ws = WebSocket;
    } else if (typeof MozWebSocket !== 'undefined') {
      ws = MozWebSocket;
    } else if (typeof commonjsGlobal !== 'undefined') {
      ws = commonjsGlobal.WebSocket || commonjsGlobal.MozWebSocket;
    } else if (typeof window !== 'undefined') {
      ws = window.WebSocket || window.MozWebSocket;
    } else if (typeof self !== 'undefined') {
      ws = self.WebSocket || self.MozWebSocket;
    }

    var browser = ws;

    var TEXT_ENCODING_AVAILABLE = typeof process !== "undefined" &&
        process.env.TEXT_ENCODING !== "never" &&
        typeof TextEncoder !== "undefined" &&
        typeof TextDecoder !== "undefined";
    var STR_SIZE_MAX = 4294967295; // uint32_max
    function utf8Count(str) {
        var strLength = str.length;
        var byteLength = 0;
        var pos = 0;
        while (pos < strLength) {
            var value = str.charCodeAt(pos++);
            if ((value & 0xffffff80) === 0) {
                // 1-byte
                byteLength++;
                continue;
            }
            else if ((value & 0xfffff800) === 0) {
                // 2-bytes
                byteLength += 2;
            }
            else {
                // handle surrogate pair
                if (value >= 0xd800 && value <= 0xdbff) {
                    // high surrogate
                    if (pos < strLength) {
                        var extra = str.charCodeAt(pos);
                        if ((extra & 0xfc00) === 0xdc00) {
                            ++pos;
                            value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                        }
                    }
                }
                if ((value & 0xffff0000) === 0) {
                    // 3-byte
                    byteLength += 3;
                }
                else {
                    // 4-byte
                    byteLength += 4;
                }
            }
        }
        return byteLength;
    }
    function utf8EncodeJs(str, output, outputOffset) {
        var strLength = str.length;
        var offset = outputOffset;
        var pos = 0;
        while (pos < strLength) {
            var value = str.charCodeAt(pos++);
            if ((value & 0xffffff80) === 0) {
                // 1-byte
                output[offset++] = value;
                continue;
            }
            else if ((value & 0xfffff800) === 0) {
                // 2-bytes
                output[offset++] = ((value >> 6) & 0x1f) | 0xc0;
            }
            else {
                // handle surrogate pair
                if (value >= 0xd800 && value <= 0xdbff) {
                    // high surrogate
                    if (pos < strLength) {
                        var extra = str.charCodeAt(pos);
                        if ((extra & 0xfc00) === 0xdc00) {
                            ++pos;
                            value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                        }
                    }
                }
                if ((value & 0xffff0000) === 0) {
                    // 3-byte
                    output[offset++] = ((value >> 12) & 0x0f) | 0xe0;
                    output[offset++] = ((value >> 6) & 0x3f) | 0x80;
                }
                else {
                    // 4-byte
                    output[offset++] = ((value >> 18) & 0x07) | 0xf0;
                    output[offset++] = ((value >> 12) & 0x3f) | 0x80;
                    output[offset++] = ((value >> 6) & 0x3f) | 0x80;
                }
            }
            output[offset++] = (value & 0x3f) | 0x80;
        }
    }
    var sharedTextEncoder = TEXT_ENCODING_AVAILABLE ? new TextEncoder() : undefined;
    var TEXT_ENCODER_THRESHOLD = !TEXT_ENCODING_AVAILABLE
        ? STR_SIZE_MAX
        : typeof process !== "undefined" && process.env.TEXT_ENCODING !== "force"
            ? 200
            : 0;
    function utf8EncodeTEencode(str, output, outputOffset) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        output.set(sharedTextEncoder.encode(str), outputOffset);
    }
    function utf8EncodeTEencodeInto(str, output, outputOffset) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
    }
    var utf8EncodeTE = (sharedTextEncoder === null || sharedTextEncoder === void 0 ? void 0 : sharedTextEncoder.encodeInto) ? utf8EncodeTEencodeInto : utf8EncodeTEencode;
    var CHUNK_SIZE = 4096;
    function utf8DecodeJs(bytes, inputOffset, byteLength) {
        var offset = inputOffset;
        var end = offset + byteLength;
        var units = [];
        var result = "";
        while (offset < end) {
            var byte1 = bytes[offset++];
            if ((byte1 & 0x80) === 0) {
                // 1 byte
                units.push(byte1);
            }
            else if ((byte1 & 0xe0) === 0xc0) {
                // 2 bytes
                var byte2 = bytes[offset++] & 0x3f;
                units.push(((byte1 & 0x1f) << 6) | byte2);
            }
            else if ((byte1 & 0xf0) === 0xe0) {
                // 3 bytes
                var byte2 = bytes[offset++] & 0x3f;
                var byte3 = bytes[offset++] & 0x3f;
                units.push(((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3);
            }
            else if ((byte1 & 0xf8) === 0xf0) {
                // 4 bytes
                var byte2 = bytes[offset++] & 0x3f;
                var byte3 = bytes[offset++] & 0x3f;
                var byte4 = bytes[offset++] & 0x3f;
                var unit = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
                if (unit > 0xffff) {
                    unit -= 0x10000;
                    units.push(((unit >>> 10) & 0x3ff) | 0xd800);
                    unit = 0xdc00 | (unit & 0x3ff);
                }
                units.push(unit);
            }
            else {
                units.push(byte1);
            }
            if (units.length >= CHUNK_SIZE) {
                result += String.fromCharCode.apply(String, units);
                units.length = 0;
            }
        }
        if (units.length > 0) {
            result += String.fromCharCode.apply(String, units);
        }
        return result;
    }
    var sharedTextDecoder = TEXT_ENCODING_AVAILABLE ? new TextDecoder() : null;
    var TEXT_DECODER_THRESHOLD = !TEXT_ENCODING_AVAILABLE
        ? STR_SIZE_MAX
        : typeof process !== "undefined" && process.env.TEXT_DECODER !== "force"
            ? 200
            : 0;
    function utf8DecodeTD(bytes, inputOffset, byteLength) {
        var stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return sharedTextDecoder.decode(stringBytes);
    }

    /**
     * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
     */
    var ExtData = /** @class */ (function () {
        function ExtData(type, data) {
            this.type = type;
            this.data = data;
        }
        return ExtData;
    }());

    // DataView extension to handle int64 / uint64,
    // where the actual range is 53-bits integer (a.k.a. safe integer)
    function setUint64(view, offset, value) {
        var high = value / 4294967296;
        var low = value; // high bits are truncated by DataView
        view.setUint32(offset, high);
        view.setUint32(offset + 4, low);
    }
    function setInt64(view, offset, value) {
        var high = Math.floor(value / 4294967296);
        var low = value; // high bits are truncated by DataView
        view.setUint32(offset, high);
        view.setUint32(offset + 4, low);
    }
    function getInt64(view, offset) {
        var high = view.getInt32(offset);
        var low = view.getUint32(offset + 4);
        return high * 4294967296 + low;
    }
    function getUint64(view, offset) {
        var high = view.getUint32(offset);
        var low = view.getUint32(offset + 4);
        return high * 4294967296 + low;
    }

    // https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type
    var EXT_TIMESTAMP = -1;
    var TIMESTAMP32_MAX_SEC = 0x100000000 - 1; // 32-bit unsigned int
    var TIMESTAMP64_MAX_SEC = 0x400000000 - 1; // 34-bit unsigned int
    function encodeTimeSpecToTimestamp(_a) {
        var sec = _a.sec, nsec = _a.nsec;
        if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
            // Here sec >= 0 && nsec >= 0
            if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
                // timestamp 32 = { sec32 (unsigned) }
                var rv = new Uint8Array(4);
                var view = new DataView(rv.buffer);
                view.setUint32(0, sec);
                return rv;
            }
            else {
                // timestamp 64 = { nsec30 (unsigned), sec34 (unsigned) }
                var secHigh = sec / 0x100000000;
                var secLow = sec & 0xffffffff;
                var rv = new Uint8Array(8);
                var view = new DataView(rv.buffer);
                // nsec30 | secHigh2
                view.setUint32(0, (nsec << 2) | (secHigh & 0x3));
                // secLow32
                view.setUint32(4, secLow);
                return rv;
            }
        }
        else {
            // timestamp 96 = { nsec32 (unsigned), sec64 (signed) }
            var rv = new Uint8Array(12);
            var view = new DataView(rv.buffer);
            view.setUint32(0, nsec);
            setInt64(view, 4, sec);
            return rv;
        }
    }
    function encodeDateToTimeSpec(date) {
        var msec = date.getTime();
        var sec = Math.floor(msec / 1e3);
        var nsec = (msec - sec * 1e3) * 1e6;
        // Normalizes { sec, nsec } to ensure nsec is unsigned.
        var nsecInSec = Math.floor(nsec / 1e9);
        return {
            sec: sec + nsecInSec,
            nsec: nsec - nsecInSec * 1e9,
        };
    }
    function encodeTimestampExtension(object) {
        if (object instanceof Date) {
            var timeSpec = encodeDateToTimeSpec(object);
            return encodeTimeSpecToTimestamp(timeSpec);
        }
        else {
            return null;
        }
    }
    function decodeTimestampToTimeSpec(data) {
        var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        // data may be 32, 64, or 96 bits
        switch (data.byteLength) {
            case 4: {
                // timestamp 32 = { sec32 }
                var sec = view.getUint32(0);
                var nsec = 0;
                return { sec: sec, nsec: nsec };
            }
            case 8: {
                // timestamp 64 = { nsec30, sec34 }
                var nsec30AndSecHigh2 = view.getUint32(0);
                var secLow32 = view.getUint32(4);
                var sec = (nsec30AndSecHigh2 & 0x3) * 0x100000000 + secLow32;
                var nsec = nsec30AndSecHigh2 >>> 2;
                return { sec: sec, nsec: nsec };
            }
            case 12: {
                // timestamp 96 = { nsec32 (unsigned), sec64 (signed) }
                var sec = getInt64(view, 4);
                var nsec = view.getUint32(0);
                return { sec: sec, nsec: nsec };
            }
            default:
                throw new Error("Unrecognized data size for timestamp: " + data.length);
        }
    }
    function decodeTimestampExtension(data) {
        var timeSpec = decodeTimestampToTimeSpec(data);
        return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
    }
    var timestampExtension = {
        type: EXT_TIMESTAMP,
        encode: encodeTimestampExtension,
        decode: decodeTimestampExtension,
    };

    // ExtensionCodec to handle MessagePack extensions
    var ExtensionCodec = /** @class */ (function () {
        function ExtensionCodec() {
            // built-in extensions
            this.builtInEncoders = [];
            this.builtInDecoders = [];
            // custom extensions
            this.encoders = [];
            this.decoders = [];
            this.register(timestampExtension);
        }
        ExtensionCodec.prototype.register = function (_a) {
            var type = _a.type, encode = _a.encode, decode = _a.decode;
            if (type >= 0) {
                // custom extensions
                this.encoders[type] = encode;
                this.decoders[type] = decode;
            }
            else {
                // built-in extensions
                var index = 1 + type;
                this.builtInEncoders[index] = encode;
                this.builtInDecoders[index] = decode;
            }
        };
        ExtensionCodec.prototype.tryToEncode = function (object, context) {
            // built-in extensions
            for (var i = 0; i < this.builtInEncoders.length; i++) {
                var encoder = this.builtInEncoders[i];
                if (encoder != null) {
                    var data = encoder(object, context);
                    if (data != null) {
                        var type = -1 - i;
                        return new ExtData(type, data);
                    }
                }
            }
            // custom extensions
            for (var i = 0; i < this.encoders.length; i++) {
                var encoder = this.encoders[i];
                if (encoder != null) {
                    var data = encoder(object, context);
                    if (data != null) {
                        var type = i;
                        return new ExtData(type, data);
                    }
                }
            }
            if (object instanceof ExtData) {
                // to keep ExtData as is
                return object;
            }
            return null;
        };
        ExtensionCodec.prototype.decode = function (data, type, context) {
            var decoder = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
            if (decoder) {
                return decoder(data, type, context);
            }
            else {
                // decode() does not fail, returns ExtData instead.
                return new ExtData(type, data);
            }
        };
        ExtensionCodec.defaultCodec = new ExtensionCodec();
        return ExtensionCodec;
    }());

    function ensureUint8Array(buffer) {
        if (buffer instanceof Uint8Array) {
            return buffer;
        }
        else if (ArrayBuffer.isView(buffer)) {
            return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        }
        else if (buffer instanceof ArrayBuffer) {
            return new Uint8Array(buffer);
        }
        else {
            // ArrayLike<number>
            return Uint8Array.from(buffer);
        }
    }
    function createDataView(buffer) {
        if (buffer instanceof ArrayBuffer) {
            return new DataView(buffer);
        }
        var bufferView = ensureUint8Array(buffer);
        return new DataView(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
    }

    var DEFAULT_MAX_DEPTH = 100;
    var DEFAULT_INITIAL_BUFFER_SIZE = 2048;
    var Encoder = /** @class */ (function () {
        function Encoder(extensionCodec, context, maxDepth, initialBufferSize, sortKeys, forceFloat32, ignoreUndefined, forceIntegerToFloat) {
            if (extensionCodec === void 0) { extensionCodec = ExtensionCodec.defaultCodec; }
            if (context === void 0) { context = undefined; }
            if (maxDepth === void 0) { maxDepth = DEFAULT_MAX_DEPTH; }
            if (initialBufferSize === void 0) { initialBufferSize = DEFAULT_INITIAL_BUFFER_SIZE; }
            if (sortKeys === void 0) { sortKeys = false; }
            if (forceFloat32 === void 0) { forceFloat32 = false; }
            if (ignoreUndefined === void 0) { ignoreUndefined = false; }
            if (forceIntegerToFloat === void 0) { forceIntegerToFloat = false; }
            this.extensionCodec = extensionCodec;
            this.context = context;
            this.maxDepth = maxDepth;
            this.initialBufferSize = initialBufferSize;
            this.sortKeys = sortKeys;
            this.forceFloat32 = forceFloat32;
            this.ignoreUndefined = ignoreUndefined;
            this.forceIntegerToFloat = forceIntegerToFloat;
            this.pos = 0;
            this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
            this.bytes = new Uint8Array(this.view.buffer);
        }
        Encoder.prototype.getUint8Array = function () {
            return this.bytes.subarray(0, this.pos);
        };
        Encoder.prototype.reinitializeState = function () {
            this.pos = 0;
        };
        Encoder.prototype.encode = function (object) {
            this.reinitializeState();
            this.doEncode(object, 1);
            return this.getUint8Array();
        };
        Encoder.prototype.doEncode = function (object, depth) {
            if (depth > this.maxDepth) {
                throw new Error("Too deep objects in depth " + depth);
            }
            if (object == null) {
                this.encodeNil();
            }
            else if (typeof object === "boolean") {
                this.encodeBoolean(object);
            }
            else if (typeof object === "number") {
                this.encodeNumber(object);
            }
            else if (typeof object === "string") {
                this.encodeString(object);
            }
            else {
                this.encodeObject(object, depth);
            }
        };
        Encoder.prototype.ensureBufferSizeToWrite = function (sizeToWrite) {
            var requiredSize = this.pos + sizeToWrite;
            if (this.view.byteLength < requiredSize) {
                this.resizeBuffer(requiredSize * 2);
            }
        };
        Encoder.prototype.resizeBuffer = function (newSize) {
            var newBuffer = new ArrayBuffer(newSize);
            var newBytes = new Uint8Array(newBuffer);
            var newView = new DataView(newBuffer);
            newBytes.set(this.bytes);
            this.view = newView;
            this.bytes = newBytes;
        };
        Encoder.prototype.encodeNil = function () {
            this.writeU8(0xc0);
        };
        Encoder.prototype.encodeBoolean = function (object) {
            if (object === false) {
                this.writeU8(0xc2);
            }
            else {
                this.writeU8(0xc3);
            }
        };
        Encoder.prototype.encodeNumber = function (object) {
            if (Number.isSafeInteger(object) && !this.forceIntegerToFloat) {
                if (object >= 0) {
                    if (object < 0x80) {
                        // positive fixint
                        this.writeU8(object);
                    }
                    else if (object < 0x100) {
                        // uint 8
                        this.writeU8(0xcc);
                        this.writeU8(object);
                    }
                    else if (object < 0x10000) {
                        // uint 16
                        this.writeU8(0xcd);
                        this.writeU16(object);
                    }
                    else if (object < 0x100000000) {
                        // uint 32
                        this.writeU8(0xce);
                        this.writeU32(object);
                    }
                    else {
                        // uint 64
                        this.writeU8(0xcf);
                        this.writeU64(object);
                    }
                }
                else {
                    if (object >= -0x20) {
                        // nagative fixint
                        this.writeU8(0xe0 | (object + 0x20));
                    }
                    else if (object >= -0x80) {
                        // int 8
                        this.writeU8(0xd0);
                        this.writeI8(object);
                    }
                    else if (object >= -0x8000) {
                        // int 16
                        this.writeU8(0xd1);
                        this.writeI16(object);
                    }
                    else if (object >= -0x80000000) {
                        // int 32
                        this.writeU8(0xd2);
                        this.writeI32(object);
                    }
                    else {
                        // int 64
                        this.writeU8(0xd3);
                        this.writeI64(object);
                    }
                }
            }
            else {
                // non-integer numbers
                if (this.forceFloat32) {
                    // float 32
                    this.writeU8(0xca);
                    this.writeF32(object);
                }
                else {
                    // float 64
                    this.writeU8(0xcb);
                    this.writeF64(object);
                }
            }
        };
        Encoder.prototype.writeStringHeader = function (byteLength) {
            if (byteLength < 32) {
                // fixstr
                this.writeU8(0xa0 + byteLength);
            }
            else if (byteLength < 0x100) {
                // str 8
                this.writeU8(0xd9);
                this.writeU8(byteLength);
            }
            else if (byteLength < 0x10000) {
                // str 16
                this.writeU8(0xda);
                this.writeU16(byteLength);
            }
            else if (byteLength < 0x100000000) {
                // str 32
                this.writeU8(0xdb);
                this.writeU32(byteLength);
            }
            else {
                throw new Error("Too long string: " + byteLength + " bytes in UTF-8");
            }
        };
        Encoder.prototype.encodeString = function (object) {
            var maxHeaderSize = 1 + 4;
            var strLength = object.length;
            if (strLength > TEXT_ENCODER_THRESHOLD) {
                var byteLength = utf8Count(object);
                this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
                this.writeStringHeader(byteLength);
                utf8EncodeTE(object, this.bytes, this.pos);
                this.pos += byteLength;
            }
            else {
                var byteLength = utf8Count(object);
                this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
                this.writeStringHeader(byteLength);
                utf8EncodeJs(object, this.bytes, this.pos);
                this.pos += byteLength;
            }
        };
        Encoder.prototype.encodeObject = function (object, depth) {
            // try to encode objects with custom codec first of non-primitives
            var ext = this.extensionCodec.tryToEncode(object, this.context);
            if (ext != null) {
                this.encodeExtension(ext);
            }
            else if (Array.isArray(object)) {
                this.encodeArray(object, depth);
            }
            else if (ArrayBuffer.isView(object)) {
                this.encodeBinary(object);
            }
            else if (typeof object === "object") {
                this.encodeMap(object, depth);
            }
            else {
                // symbol, function and other special object come here unless extensionCodec handles them.
                throw new Error("Unrecognized object: " + Object.prototype.toString.apply(object));
            }
        };
        Encoder.prototype.encodeBinary = function (object) {
            var size = object.byteLength;
            if (size < 0x100) {
                // bin 8
                this.writeU8(0xc4);
                this.writeU8(size);
            }
            else if (size < 0x10000) {
                // bin 16
                this.writeU8(0xc5);
                this.writeU16(size);
            }
            else if (size < 0x100000000) {
                // bin 32
                this.writeU8(0xc6);
                this.writeU32(size);
            }
            else {
                throw new Error("Too large binary: " + size);
            }
            var bytes = ensureUint8Array(object);
            this.writeU8a(bytes);
        };
        Encoder.prototype.encodeArray = function (object, depth) {
            var size = object.length;
            if (size < 16) {
                // fixarray
                this.writeU8(0x90 + size);
            }
            else if (size < 0x10000) {
                // array 16
                this.writeU8(0xdc);
                this.writeU16(size);
            }
            else if (size < 0x100000000) {
                // array 32
                this.writeU8(0xdd);
                this.writeU32(size);
            }
            else {
                throw new Error("Too large array: " + size);
            }
            for (var _i = 0, object_1 = object; _i < object_1.length; _i++) {
                var item = object_1[_i];
                this.doEncode(item, depth + 1);
            }
        };
        Encoder.prototype.countWithoutUndefined = function (object, keys) {
            var count = 0;
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                if (object[key] !== undefined) {
                    count++;
                }
            }
            return count;
        };
        Encoder.prototype.encodeMap = function (object, depth) {
            var keys = Object.keys(object);
            if (this.sortKeys) {
                keys.sort();
            }
            var size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
            if (size < 16) {
                // fixmap
                this.writeU8(0x80 + size);
            }
            else if (size < 0x10000) {
                // map 16
                this.writeU8(0xde);
                this.writeU16(size);
            }
            else if (size < 0x100000000) {
                // map 32
                this.writeU8(0xdf);
                this.writeU32(size);
            }
            else {
                throw new Error("Too large map object: " + size);
            }
            for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
                var key = keys_2[_i];
                var value = object[key];
                if (!(this.ignoreUndefined && value === undefined)) {
                    this.encodeString(key);
                    this.doEncode(value, depth + 1);
                }
            }
        };
        Encoder.prototype.encodeExtension = function (ext) {
            var size = ext.data.length;
            if (size === 1) {
                // fixext 1
                this.writeU8(0xd4);
            }
            else if (size === 2) {
                // fixext 2
                this.writeU8(0xd5);
            }
            else if (size === 4) {
                // fixext 4
                this.writeU8(0xd6);
            }
            else if (size === 8) {
                // fixext 8
                this.writeU8(0xd7);
            }
            else if (size === 16) {
                // fixext 16
                this.writeU8(0xd8);
            }
            else if (size < 0x100) {
                // ext 8
                this.writeU8(0xc7);
                this.writeU8(size);
            }
            else if (size < 0x10000) {
                // ext 16
                this.writeU8(0xc8);
                this.writeU16(size);
            }
            else if (size < 0x100000000) {
                // ext 32
                this.writeU8(0xc9);
                this.writeU32(size);
            }
            else {
                throw new Error("Too large extension object: " + size);
            }
            this.writeI8(ext.type);
            this.writeU8a(ext.data);
        };
        Encoder.prototype.writeU8 = function (value) {
            this.ensureBufferSizeToWrite(1);
            this.view.setUint8(this.pos, value);
            this.pos++;
        };
        Encoder.prototype.writeU8a = function (values) {
            var size = values.length;
            this.ensureBufferSizeToWrite(size);
            this.bytes.set(values, this.pos);
            this.pos += size;
        };
        Encoder.prototype.writeI8 = function (value) {
            this.ensureBufferSizeToWrite(1);
            this.view.setInt8(this.pos, value);
            this.pos++;
        };
        Encoder.prototype.writeU16 = function (value) {
            this.ensureBufferSizeToWrite(2);
            this.view.setUint16(this.pos, value);
            this.pos += 2;
        };
        Encoder.prototype.writeI16 = function (value) {
            this.ensureBufferSizeToWrite(2);
            this.view.setInt16(this.pos, value);
            this.pos += 2;
        };
        Encoder.prototype.writeU32 = function (value) {
            this.ensureBufferSizeToWrite(4);
            this.view.setUint32(this.pos, value);
            this.pos += 4;
        };
        Encoder.prototype.writeI32 = function (value) {
            this.ensureBufferSizeToWrite(4);
            this.view.setInt32(this.pos, value);
            this.pos += 4;
        };
        Encoder.prototype.writeF32 = function (value) {
            this.ensureBufferSizeToWrite(4);
            this.view.setFloat32(this.pos, value);
            this.pos += 4;
        };
        Encoder.prototype.writeF64 = function (value) {
            this.ensureBufferSizeToWrite(8);
            this.view.setFloat64(this.pos, value);
            this.pos += 8;
        };
        Encoder.prototype.writeU64 = function (value) {
            this.ensureBufferSizeToWrite(8);
            setUint64(this.view, this.pos, value);
            this.pos += 8;
        };
        Encoder.prototype.writeI64 = function (value) {
            this.ensureBufferSizeToWrite(8);
            setInt64(this.view, this.pos, value);
            this.pos += 8;
        };
        return Encoder;
    }());

    var defaultEncodeOptions = {};
    /**
     * It encodes `value` in the MessagePack format and
     * returns a byte buffer.
     *
     * The returned buffer is a slice of a larger `ArrayBuffer`, so you have to use its `#byteOffset` and `#byteLength` in order to convert it to another typed arrays including NodeJS `Buffer`.
     */
    function encode(value, options) {
        if (options === void 0) { options = defaultEncodeOptions; }
        var encoder = new Encoder(options.extensionCodec, options.context, options.maxDepth, options.initialBufferSize, options.sortKeys, options.forceFloat32, options.ignoreUndefined, options.forceIntegerToFloat);
        return encoder.encode(value);
    }

    function prettyByte(byte) {
        return (byte < 0 ? "-" : "") + "0x" + Math.abs(byte).toString(16).padStart(2, "0");
    }

    var DEFAULT_MAX_KEY_LENGTH = 16;
    var DEFAULT_MAX_LENGTH_PER_KEY = 16;
    var CachedKeyDecoder = /** @class */ (function () {
        function CachedKeyDecoder(maxKeyLength, maxLengthPerKey) {
            if (maxKeyLength === void 0) { maxKeyLength = DEFAULT_MAX_KEY_LENGTH; }
            if (maxLengthPerKey === void 0) { maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY; }
            this.maxKeyLength = maxKeyLength;
            this.maxLengthPerKey = maxLengthPerKey;
            this.hit = 0;
            this.miss = 0;
            // avoid `new Array(N)` to create a non-sparse array for performance.
            this.caches = [];
            for (var i = 0; i < this.maxKeyLength; i++) {
                this.caches.push([]);
            }
        }
        CachedKeyDecoder.prototype.canBeCached = function (byteLength) {
            return byteLength > 0 && byteLength <= this.maxKeyLength;
        };
        CachedKeyDecoder.prototype.get = function (bytes, inputOffset, byteLength) {
            var records = this.caches[byteLength - 1];
            var recordsLength = records.length;
            FIND_CHUNK: for (var i = 0; i < recordsLength; i++) {
                var record = records[i];
                var recordBytes = record.bytes;
                for (var j = 0; j < byteLength; j++) {
                    if (recordBytes[j] !== bytes[inputOffset + j]) {
                        continue FIND_CHUNK;
                    }
                }
                return record.value;
            }
            return null;
        };
        CachedKeyDecoder.prototype.store = function (bytes, value) {
            var records = this.caches[bytes.length - 1];
            var record = { bytes: bytes, value: value };
            if (records.length >= this.maxLengthPerKey) {
                // `records` are full!
                // Set `record` to a randomized position.
                records[(Math.random() * records.length) | 0] = record;
            }
            else {
                records.push(record);
            }
        };
        CachedKeyDecoder.prototype.decode = function (bytes, inputOffset, byteLength) {
            var cachedValue = this.get(bytes, inputOffset, byteLength);
            if (cachedValue != null) {
                this.hit++;
                return cachedValue;
            }
            this.miss++;
            var value = utf8DecodeJs(bytes, inputOffset, byteLength);
            // Ensure to copy a slice of bytes because the byte may be NodeJS Buffer and Buffer#slice() returns a reference to its internal ArrayBuffer.
            var slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
            this.store(slicedCopyOfBytes, value);
            return value;
        };
        return CachedKeyDecoder;
    }());

    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __asyncValues = (undefined && undefined.__asyncValues) || function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    };
    var __await = (undefined && undefined.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); };
    var __asyncGenerator = (undefined && undefined.__asyncGenerator) || function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };
    var isValidMapKeyType = function (key) {
        var keyType = typeof key;
        return keyType === "string" || keyType === "number";
    };
    var HEAD_BYTE_REQUIRED = -1;
    var EMPTY_VIEW = new DataView(new ArrayBuffer(0));
    var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
    // IE11: Hack to support IE11.
    // IE11: Drop this hack and just use RangeError when IE11 is obsolete.
    var DataViewIndexOutOfBoundsError = (function () {
        try {
            // IE11: The spec says it should throw RangeError,
            // IE11: but in IE11 it throws TypeError.
            EMPTY_VIEW.getInt8(0);
        }
        catch (e) {
            return e.constructor;
        }
        throw new Error("never reached");
    })();
    var MORE_DATA = new DataViewIndexOutOfBoundsError("Insufficient data");
    var DEFAULT_MAX_LENGTH = 4294967295; // uint32_max
    var sharedCachedKeyDecoder = new CachedKeyDecoder();
    var Decoder = /** @class */ (function () {
        function Decoder(extensionCodec, context, maxStrLength, maxBinLength, maxArrayLength, maxMapLength, maxExtLength, keyDecoder) {
            if (extensionCodec === void 0) { extensionCodec = ExtensionCodec.defaultCodec; }
            if (context === void 0) { context = undefined; }
            if (maxStrLength === void 0) { maxStrLength = DEFAULT_MAX_LENGTH; }
            if (maxBinLength === void 0) { maxBinLength = DEFAULT_MAX_LENGTH; }
            if (maxArrayLength === void 0) { maxArrayLength = DEFAULT_MAX_LENGTH; }
            if (maxMapLength === void 0) { maxMapLength = DEFAULT_MAX_LENGTH; }
            if (maxExtLength === void 0) { maxExtLength = DEFAULT_MAX_LENGTH; }
            if (keyDecoder === void 0) { keyDecoder = sharedCachedKeyDecoder; }
            this.extensionCodec = extensionCodec;
            this.context = context;
            this.maxStrLength = maxStrLength;
            this.maxBinLength = maxBinLength;
            this.maxArrayLength = maxArrayLength;
            this.maxMapLength = maxMapLength;
            this.maxExtLength = maxExtLength;
            this.keyDecoder = keyDecoder;
            this.totalPos = 0;
            this.pos = 0;
            this.view = EMPTY_VIEW;
            this.bytes = EMPTY_BYTES;
            this.headByte = HEAD_BYTE_REQUIRED;
            this.stack = [];
        }
        Decoder.prototype.reinitializeState = function () {
            this.totalPos = 0;
            this.headByte = HEAD_BYTE_REQUIRED;
        };
        Decoder.prototype.setBuffer = function (buffer) {
            this.bytes = ensureUint8Array(buffer);
            this.view = createDataView(this.bytes);
            this.pos = 0;
        };
        Decoder.prototype.appendBuffer = function (buffer) {
            if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining()) {
                this.setBuffer(buffer);
            }
            else {
                // retried because data is insufficient
                var remainingData = this.bytes.subarray(this.pos);
                var newData = ensureUint8Array(buffer);
                var concated = new Uint8Array(remainingData.length + newData.length);
                concated.set(remainingData);
                concated.set(newData, remainingData.length);
                this.setBuffer(concated);
            }
        };
        Decoder.prototype.hasRemaining = function (size) {
            if (size === void 0) { size = 1; }
            return this.view.byteLength - this.pos >= size;
        };
        Decoder.prototype.createExtraByteError = function (posToShow) {
            var _a = this, view = _a.view, pos = _a.pos;
            return new RangeError("Extra " + (view.byteLength - pos) + " of " + view.byteLength + " byte(s) found at buffer[" + posToShow + "]");
        };
        Decoder.prototype.decode = function (buffer) {
            this.reinitializeState();
            this.setBuffer(buffer);
            var object = this.doDecodeSync();
            if (this.hasRemaining()) {
                throw this.createExtraByteError(this.pos);
            }
            return object;
        };
        Decoder.prototype.decodeAsync = function (stream) {
            var stream_1, stream_1_1;
            var e_1, _a;
            return __awaiter(this, void 0, void 0, function () {
                var decoded, object, buffer, e_1_1, _b, headByte, pos, totalPos;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            decoded = false;
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 6, 7, 12]);
                            stream_1 = __asyncValues(stream);
                            _c.label = 2;
                        case 2: return [4 /*yield*/, stream_1.next()];
                        case 3:
                            if (!(stream_1_1 = _c.sent(), !stream_1_1.done)) return [3 /*break*/, 5];
                            buffer = stream_1_1.value;
                            if (decoded) {
                                throw this.createExtraByteError(this.totalPos);
                            }
                            this.appendBuffer(buffer);
                            try {
                                object = this.doDecodeSync();
                                decoded = true;
                            }
                            catch (e) {
                                if (!(e instanceof DataViewIndexOutOfBoundsError)) {
                                    throw e; // rethrow
                                }
                                // fallthrough
                            }
                            this.totalPos += this.pos;
                            _c.label = 4;
                        case 4: return [3 /*break*/, 2];
                        case 5: return [3 /*break*/, 12];
                        case 6:
                            e_1_1 = _c.sent();
                            e_1 = { error: e_1_1 };
                            return [3 /*break*/, 12];
                        case 7:
                            _c.trys.push([7, , 10, 11]);
                            if (!(stream_1_1 && !stream_1_1.done && (_a = stream_1.return))) return [3 /*break*/, 9];
                            return [4 /*yield*/, _a.call(stream_1)];
                        case 8:
                            _c.sent();
                            _c.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            if (e_1) throw e_1.error;
                            return [7 /*endfinally*/];
                        case 11: return [7 /*endfinally*/];
                        case 12:
                            if (decoded) {
                                if (this.hasRemaining()) {
                                    throw this.createExtraByteError(this.totalPos);
                                }
                                return [2 /*return*/, object];
                            }
                            _b = this, headByte = _b.headByte, pos = _b.pos, totalPos = _b.totalPos;
                            throw new RangeError("Insufficient data in parsing " + prettyByte(headByte) + " at " + totalPos + " (" + pos + " in the current buffer)");
                    }
                });
            });
        };
        Decoder.prototype.decodeArrayStream = function (stream) {
            return this.decodeMultiAsync(stream, true);
        };
        Decoder.prototype.decodeStream = function (stream) {
            return this.decodeMultiAsync(stream, false);
        };
        Decoder.prototype.decodeMultiAsync = function (stream, isArray) {
            return __asyncGenerator(this, arguments, function decodeMultiAsync_1() {
                var isArrayHeaderRequired, arrayItemsLeft, stream_2, stream_2_1, buffer, e_2, e_3_1;
                var e_3, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            isArrayHeaderRequired = isArray;
                            arrayItemsLeft = -1;
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 13, 14, 19]);
                            stream_2 = __asyncValues(stream);
                            _b.label = 2;
                        case 2: return [4 /*yield*/, __await(stream_2.next())];
                        case 3:
                            if (!(stream_2_1 = _b.sent(), !stream_2_1.done)) return [3 /*break*/, 12];
                            buffer = stream_2_1.value;
                            if (isArray && arrayItemsLeft === 0) {
                                throw this.createExtraByteError(this.totalPos);
                            }
                            this.appendBuffer(buffer);
                            if (isArrayHeaderRequired) {
                                arrayItemsLeft = this.readArraySize();
                                isArrayHeaderRequired = false;
                                this.complete();
                            }
                            _b.label = 4;
                        case 4:
                            _b.trys.push([4, 9, , 10]);
                            _b.label = 5;
                        case 5:
                            return [4 /*yield*/, __await(this.doDecodeSync())];
                        case 6: return [4 /*yield*/, _b.sent()];
                        case 7:
                            _b.sent();
                            if (--arrayItemsLeft === 0) {
                                return [3 /*break*/, 8];
                            }
                            return [3 /*break*/, 5];
                        case 8: return [3 /*break*/, 10];
                        case 9:
                            e_2 = _b.sent();
                            if (!(e_2 instanceof DataViewIndexOutOfBoundsError)) {
                                throw e_2; // rethrow
                            }
                            return [3 /*break*/, 10];
                        case 10:
                            this.totalPos += this.pos;
                            _b.label = 11;
                        case 11: return [3 /*break*/, 2];
                        case 12: return [3 /*break*/, 19];
                        case 13:
                            e_3_1 = _b.sent();
                            e_3 = { error: e_3_1 };
                            return [3 /*break*/, 19];
                        case 14:
                            _b.trys.push([14, , 17, 18]);
                            if (!(stream_2_1 && !stream_2_1.done && (_a = stream_2.return))) return [3 /*break*/, 16];
                            return [4 /*yield*/, __await(_a.call(stream_2))];
                        case 15:
                            _b.sent();
                            _b.label = 16;
                        case 16: return [3 /*break*/, 18];
                        case 17:
                            if (e_3) throw e_3.error;
                            return [7 /*endfinally*/];
                        case 18: return [7 /*endfinally*/];
                        case 19: return [2 /*return*/];
                    }
                });
            });
        };
        Decoder.prototype.doDecodeSync = function () {
            DECODE: while (true) {
                var headByte = this.readHeadByte();
                var object = void 0;
                if (headByte >= 0xe0) {
                    // negative fixint (111x xxxx) 0xe0 - 0xff
                    object = headByte - 0x100;
                }
                else if (headByte < 0xc0) {
                    if (headByte < 0x80) {
                        // positive fixint (0xxx xxxx) 0x00 - 0x7f
                        object = headByte;
                    }
                    else if (headByte < 0x90) {
                        // fixmap (1000 xxxx) 0x80 - 0x8f
                        var size = headByte - 0x80;
                        if (size !== 0) {
                            this.pushMapState(size);
                            this.complete();
                            continue DECODE;
                        }
                        else {
                            object = {};
                        }
                    }
                    else if (headByte < 0xa0) {
                        // fixarray (1001 xxxx) 0x90 - 0x9f
                        var size = headByte - 0x90;
                        if (size !== 0) {
                            this.pushArrayState(size);
                            this.complete();
                            continue DECODE;
                        }
                        else {
                            object = [];
                        }
                    }
                    else {
                        // fixstr (101x xxxx) 0xa0 - 0xbf
                        var byteLength = headByte - 0xa0;
                        object = this.decodeUtf8String(byteLength, 0);
                    }
                }
                else if (headByte === 0xc0) {
                    // nil
                    object = null;
                }
                else if (headByte === 0xc2) {
                    // false
                    object = false;
                }
                else if (headByte === 0xc3) {
                    // true
                    object = true;
                }
                else if (headByte === 0xca) {
                    // float 32
                    object = this.readF32();
                }
                else if (headByte === 0xcb) {
                    // float 64
                    object = this.readF64();
                }
                else if (headByte === 0xcc) {
                    // uint 8
                    object = this.readU8();
                }
                else if (headByte === 0xcd) {
                    // uint 16
                    object = this.readU16();
                }
                else if (headByte === 0xce) {
                    // uint 32
                    object = this.readU32();
                }
                else if (headByte === 0xcf) {
                    // uint 64
                    object = this.readU64();
                }
                else if (headByte === 0xd0) {
                    // int 8
                    object = this.readI8();
                }
                else if (headByte === 0xd1) {
                    // int 16
                    object = this.readI16();
                }
                else if (headByte === 0xd2) {
                    // int 32
                    object = this.readI32();
                }
                else if (headByte === 0xd3) {
                    // int 64
                    object = this.readI64();
                }
                else if (headByte === 0xd9) {
                    // str 8
                    var byteLength = this.lookU8();
                    object = this.decodeUtf8String(byteLength, 1);
                }
                else if (headByte === 0xda) {
                    // str 16
                    var byteLength = this.lookU16();
                    object = this.decodeUtf8String(byteLength, 2);
                }
                else if (headByte === 0xdb) {
                    // str 32
                    var byteLength = this.lookU32();
                    object = this.decodeUtf8String(byteLength, 4);
                }
                else if (headByte === 0xdc) {
                    // array 16
                    var size = this.readU16();
                    if (size !== 0) {
                        this.pushArrayState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = [];
                    }
                }
                else if (headByte === 0xdd) {
                    // array 32
                    var size = this.readU32();
                    if (size !== 0) {
                        this.pushArrayState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = [];
                    }
                }
                else if (headByte === 0xde) {
                    // map 16
                    var size = this.readU16();
                    if (size !== 0) {
                        this.pushMapState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = {};
                    }
                }
                else if (headByte === 0xdf) {
                    // map 32
                    var size = this.readU32();
                    if (size !== 0) {
                        this.pushMapState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = {};
                    }
                }
                else if (headByte === 0xc4) {
                    // bin 8
                    var size = this.lookU8();
                    object = this.decodeBinary(size, 1);
                }
                else if (headByte === 0xc5) {
                    // bin 16
                    var size = this.lookU16();
                    object = this.decodeBinary(size, 2);
                }
                else if (headByte === 0xc6) {
                    // bin 32
                    var size = this.lookU32();
                    object = this.decodeBinary(size, 4);
                }
                else if (headByte === 0xd4) {
                    // fixext 1
                    object = this.decodeExtension(1, 0);
                }
                else if (headByte === 0xd5) {
                    // fixext 2
                    object = this.decodeExtension(2, 0);
                }
                else if (headByte === 0xd6) {
                    // fixext 4
                    object = this.decodeExtension(4, 0);
                }
                else if (headByte === 0xd7) {
                    // fixext 8
                    object = this.decodeExtension(8, 0);
                }
                else if (headByte === 0xd8) {
                    // fixext 16
                    object = this.decodeExtension(16, 0);
                }
                else if (headByte === 0xc7) {
                    // ext 8
                    var size = this.lookU8();
                    object = this.decodeExtension(size, 1);
                }
                else if (headByte === 0xc8) {
                    // ext 16
                    var size = this.lookU16();
                    object = this.decodeExtension(size, 2);
                }
                else if (headByte === 0xc9) {
                    // ext 32
                    var size = this.lookU32();
                    object = this.decodeExtension(size, 4);
                }
                else {
                    throw new Error("Unrecognized type byte: " + prettyByte(headByte));
                }
                this.complete();
                var stack = this.stack;
                while (stack.length > 0) {
                    // arrays and maps
                    var state = stack[stack.length - 1];
                    if (state.type === 0 /* ARRAY */) {
                        state.array[state.position] = object;
                        state.position++;
                        if (state.position === state.size) {
                            stack.pop();
                            object = state.array;
                        }
                        else {
                            continue DECODE;
                        }
                    }
                    else if (state.type === 1 /* MAP_KEY */) {
                        if (!isValidMapKeyType(object)) {
                            throw new Error("The type of key must be string or number but " + typeof object);
                        }
                        state.key = object;
                        state.type = 2 /* MAP_VALUE */;
                        continue DECODE;
                    }
                    else {
                        // it must be `state.type === State.MAP_VALUE` here
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        state.map[state.key] = object;
                        state.readCount++;
                        if (state.readCount === state.size) {
                            stack.pop();
                            object = state.map;
                        }
                        else {
                            state.key = null;
                            state.type = 1 /* MAP_KEY */;
                            continue DECODE;
                        }
                    }
                }
                return object;
            }
        };
        Decoder.prototype.readHeadByte = function () {
            if (this.headByte === HEAD_BYTE_REQUIRED) {
                this.headByte = this.readU8();
                // console.log("headByte", prettyByte(this.headByte));
            }
            return this.headByte;
        };
        Decoder.prototype.complete = function () {
            this.headByte = HEAD_BYTE_REQUIRED;
        };
        Decoder.prototype.readArraySize = function () {
            var headByte = this.readHeadByte();
            switch (headByte) {
                case 0xdc:
                    return this.readU16();
                case 0xdd:
                    return this.readU32();
                default: {
                    if (headByte < 0xa0) {
                        return headByte - 0x90;
                    }
                    else {
                        throw new Error("Unrecognized array type byte: " + prettyByte(headByte));
                    }
                }
            }
        };
        Decoder.prototype.pushMapState = function (size) {
            if (size > this.maxMapLength) {
                throw new Error("Max length exceeded: map length (" + size + ") > maxMapLengthLength (" + this.maxMapLength + ")");
            }
            this.stack.push({
                type: 1 /* MAP_KEY */,
                size: size,
                key: null,
                readCount: 0,
                map: {},
            });
        };
        Decoder.prototype.pushArrayState = function (size) {
            if (size > this.maxArrayLength) {
                throw new Error("Max length exceeded: array length (" + size + ") > maxArrayLength (" + this.maxArrayLength + ")");
            }
            this.stack.push({
                type: 0 /* ARRAY */,
                size: size,
                array: new Array(size),
                position: 0,
            });
        };
        Decoder.prototype.decodeUtf8String = function (byteLength, headerOffset) {
            var _a;
            if (byteLength > this.maxStrLength) {
                throw new Error("Max length exceeded: UTF-8 byte length (" + byteLength + ") > maxStrLength (" + this.maxStrLength + ")");
            }
            if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
                throw MORE_DATA;
            }
            var offset = this.pos + headerOffset;
            var object;
            if (this.stateIsMapKey() && ((_a = this.keyDecoder) === null || _a === void 0 ? void 0 : _a.canBeCached(byteLength))) {
                object = this.keyDecoder.decode(this.bytes, offset, byteLength);
            }
            else if (byteLength > TEXT_DECODER_THRESHOLD) {
                object = utf8DecodeTD(this.bytes, offset, byteLength);
            }
            else {
                object = utf8DecodeJs(this.bytes, offset, byteLength);
            }
            this.pos += headerOffset + byteLength;
            return object;
        };
        Decoder.prototype.stateIsMapKey = function () {
            if (this.stack.length > 0) {
                var state = this.stack[this.stack.length - 1];
                return state.type === 1 /* MAP_KEY */;
            }
            return false;
        };
        Decoder.prototype.decodeBinary = function (byteLength, headOffset) {
            if (byteLength > this.maxBinLength) {
                throw new Error("Max length exceeded: bin length (" + byteLength + ") > maxBinLength (" + this.maxBinLength + ")");
            }
            if (!this.hasRemaining(byteLength + headOffset)) {
                throw MORE_DATA;
            }
            var offset = this.pos + headOffset;
            var object = this.bytes.subarray(offset, offset + byteLength);
            this.pos += headOffset + byteLength;
            return object;
        };
        Decoder.prototype.decodeExtension = function (size, headOffset) {
            if (size > this.maxExtLength) {
                throw new Error("Max length exceeded: ext length (" + size + ") > maxExtLength (" + this.maxExtLength + ")");
            }
            var extType = this.view.getInt8(this.pos + headOffset);
            var data = this.decodeBinary(size, headOffset + 1 /* extType */);
            return this.extensionCodec.decode(data, extType, this.context);
        };
        Decoder.prototype.lookU8 = function () {
            return this.view.getUint8(this.pos);
        };
        Decoder.prototype.lookU16 = function () {
            return this.view.getUint16(this.pos);
        };
        Decoder.prototype.lookU32 = function () {
            return this.view.getUint32(this.pos);
        };
        Decoder.prototype.readU8 = function () {
            var value = this.view.getUint8(this.pos);
            this.pos++;
            return value;
        };
        Decoder.prototype.readI8 = function () {
            var value = this.view.getInt8(this.pos);
            this.pos++;
            return value;
        };
        Decoder.prototype.readU16 = function () {
            var value = this.view.getUint16(this.pos);
            this.pos += 2;
            return value;
        };
        Decoder.prototype.readI16 = function () {
            var value = this.view.getInt16(this.pos);
            this.pos += 2;
            return value;
        };
        Decoder.prototype.readU32 = function () {
            var value = this.view.getUint32(this.pos);
            this.pos += 4;
            return value;
        };
        Decoder.prototype.readI32 = function () {
            var value = this.view.getInt32(this.pos);
            this.pos += 4;
            return value;
        };
        Decoder.prototype.readU64 = function () {
            var value = getUint64(this.view, this.pos);
            this.pos += 8;
            return value;
        };
        Decoder.prototype.readI64 = function () {
            var value = getInt64(this.view, this.pos);
            this.pos += 8;
            return value;
        };
        Decoder.prototype.readF32 = function () {
            var value = this.view.getFloat32(this.pos);
            this.pos += 4;
            return value;
        };
        Decoder.prototype.readF64 = function () {
            var value = this.view.getFloat64(this.pos);
            this.pos += 8;
            return value;
        };
        return Decoder;
    }());

    var defaultDecodeOptions = {};
    /**
     * It decodes a MessagePack-encoded buffer.
     *
     * This is a synchronous decoding function. See other variants for asynchronous decoding: `decodeAsync()`, `decodeStream()`, `decodeArrayStream()`.
     */
    function decode(buffer, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        var decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
        return decoder.decode(buffer);
    }

    // utility for whatwg streams
    var __generator$1 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __await$1 = (undefined && undefined.__await) || function (v) { return this instanceof __await$1 ? (this.v = v, this) : new __await$1(v); };
    var __asyncGenerator$1 = (undefined && undefined.__asyncGenerator) || function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await$1 ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };
    function isAsyncIterable(object) {
        return object[Symbol.asyncIterator] != null;
    }
    function assertNonNull(value) {
        if (value == null) {
            throw new Error("Assertion Failure: value must not be null nor undefined");
        }
    }
    function asyncIterableFromStream(stream) {
        return __asyncGenerator$1(this, arguments, function asyncIterableFromStream_1() {
            var reader, _a, done, value;
            return __generator$1(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        reader = stream.getReader();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, , 9, 10]);
                        _b.label = 2;
                    case 2:
                        return [4 /*yield*/, __await$1(reader.read())];
                    case 3:
                        _a = _b.sent(), done = _a.done, value = _a.value;
                        if (!done) return [3 /*break*/, 5];
                        return [4 /*yield*/, __await$1(void 0)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5:
                        assertNonNull(value);
                        return [4 /*yield*/, __await$1(value)];
                    case 6: return [4 /*yield*/, _b.sent()];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 2];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        reader.releaseLock();
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    }
    function ensureAsyncIterabe(streamLike) {
        if (isAsyncIterable(streamLike)) {
            return streamLike;
        }
        else {
            return asyncIterableFromStream(streamLike);
        }
    }

    var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator$2 = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    function decodeAsync(streamLike, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        return __awaiter$1(this, void 0, void 0, function () {
            var stream, decoder;
            return __generator$2(this, function (_a) {
                stream = ensureAsyncIterabe(streamLike);
                decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
                return [2 /*return*/, decoder.decodeAsync(stream)];
            });
        });
    }
    function decodeArrayStream(streamLike, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        var stream = ensureAsyncIterabe(streamLike);
        var decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
        return decoder.decodeArrayStream(stream);
    }
    function decodeStream(streamLike, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        var stream = ensureAsyncIterabe(streamLike);
        var decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
        return decoder.decodeStream(stream);
    }

    // Main Functions:

    var dist_es5_esm = /*#__PURE__*/Object.freeze({
        __proto__: null,
        encode: encode,
        decode: decode,
        decodeAsync: decodeAsync,
        decodeArrayStream: decodeArrayStream,
        decodeStream: decodeStream,
        Decoder: Decoder,
        Encoder: Encoder,
        ExtensionCodec: ExtensionCodec,
        ExtData: ExtData,
        EXT_TIMESTAMP: EXT_TIMESTAMP,
        encodeDateToTimeSpec: encodeDateToTimeSpec,
        encodeTimeSpecToTimestamp: encodeTimeSpecToTimestamp,
        decodeTimestampToTimeSpec: decodeTimestampToTimeSpec,
        encodeTimestampExtension: encodeTimestampExtension,
        decodeTimestampExtension: decodeTimestampExtension
    });

    // This alphabet uses `A-Za-z0-9_-` symbols. The genetic algorithm helped
    // optimize the gzip compression for this alphabet.
    let urlAlphabet =
      'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW';

    // This file replaces `index.js` in bundlers like webpack or Rollup,

    {
      // All bundlers will remove this block in the production bundle.
      if (
        typeof navigator !== 'undefined' &&
        navigator.product === 'ReactNative' &&
        typeof crypto === 'undefined'
      ) {
        throw new Error(
          'React Native does not have a built-in secure random generator. ' +
            'If you don’t need unpredictable IDs use `nanoid/non-secure`. ' +
            'For secure IDs, import `react-native-get-random-values` ' +
            'before Nano ID. If you use Expo, install `expo-random` ' +
            'and use `nanoid/async`.'
        )
      }
      if (typeof msCrypto !== 'undefined' && typeof crypto === 'undefined') {
        throw new Error(
          'Import file with `if (!window.crypto) window.crypto = window.msCrypto`' +
            ' before importing Nano ID to fix IE 11 support'
        )
      }
      if (typeof crypto === 'undefined') {
        throw new Error(
          'Your browser does not have secure random generator. ' +
            'If you don’t need unpredictable IDs, you can use nanoid/non-secure.'
        )
      }
    }

    let random = bytes => crypto.getRandomValues(new Uint8Array(bytes));

    let customRandom = (alphabet, size, getRandom) => {
      // First, a bitmask is necessary to generate the ID. The bitmask makes bytes
      // values closer to the alphabet size. The bitmask calculates the closest
      // `2^31 - 1` number, which exceeds the alphabet size.
      // For example, the bitmask for the alphabet size 30 is 31 (00011111).
      // `Math.clz32` is not used, because it is not available in browsers.
      let mask = (2 << (Math.log(alphabet.length - 1) / Math.LN2)) - 1;
      // Though, the bitmask solution is not perfect since the bytes exceeding
      // the alphabet size are refused. Therefore, to reliably generate the ID,
      // the random bytes redundancy has to be satisfied.

      // Note: every hardware random generator call is performance expensive,
      // because the system call for entropy collection takes a lot of time.
      // So, to avoid additional system calls, extra bytes are requested in advance.

      // Next, a step determines how many random bytes to generate.
      // The number of random bytes gets decided upon the ID size, mask,
      // alphabet size, and magic number 1.6 (using 1.6 peaks at performance
      // according to benchmarks).

      // `-~f => Math.ceil(f)` if f is a float
      // `-~i => i + 1` if i is an integer
      let step = -~((1.6 * mask * size) / alphabet.length);

      return () => {
        let id = '';
        while (true) {
          let bytes = getRandom(step);
          // A compact alternative for `for (var i = 0; i < step; i++)`.
          let j = step;
          while (j--) {
            // Adding `|| ''` refuses a random byte that exceeds the alphabet size.
            id += alphabet[bytes[j] & mask] || '';
            if (id.length === size) return id
          }
        }
      }
    };

    let customAlphabet = (alphabet, size) => customRandom(alphabet, size, random);

    let nanoid = (size = 21) => {
      let id = '';
      let bytes = crypto.getRandomValues(new Uint8Array(size));

      // A compact alternative for `for (var i = 0; i < step; i++)`.
      while (size--) {
        // It is incorrect to use bytes exceeding the alphabet size.
        // The following mask reduces the random byte in the 0-255 value
        // range to the 0-63 value range. Therefore, adding hacks, such
        // as empty string fallback or magic numbers, is unneccessary because
        // the bitmask trims bytes down to the alphabet size.
        let byte = bytes[size] & 63;
        if (byte < 36) {
          // `0-9a-z`
          id += byte.toString(36);
        } else if (byte < 62) {
          // `A-Z`
          id += (byte - 26).toString(36).toUpperCase();
        } else if (byte < 63) {
          id += '_';
        } else {
          id += '-';
        }
      }
      return id
    };

    var index_browser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        nanoid: nanoid,
        customAlphabet: customAlphabet,
        customRandom: customRandom,
        urlAlphabet: urlAlphabet,
        random: random
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(dist_es5_esm);

    var nanoid_1 = /*@__PURE__*/getAugmentedNamespace(index_browser);

    var client = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    });
    var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WsClient = void 0;
    const isomorphic_ws_1 = __importDefault(browser);
    const msgpack = __importStar(require$$0);

    /**
     * A Websocket client which can make requests and receive responses,
     * as well as send and receive signals
     *
     * Uses Holochain's websocket WireMessage for communication.
     */
    class WsClient {
        constructor(socket) {
            this.socket = socket;
            this.pendingRequests = {};
            // TODO: allow adding signal handlers later
        }
        emitSignal(data) {
            const encodedMsg = msgpack.encode({
                type: 'Signal',
                data: msgpack.encode(data),
            });
            this.socket.send(encodedMsg);
        }
        request(data) {
            const id = nanoid_1.nanoid();
            const encodedMsg = msgpack.encode({
                id,
                type: 'Request',
                data: msgpack.encode(data),
            });
            const promise = new Promise((fulfill) => {
                this.pendingRequests[id] = { fulfill };
            });
            if (this.socket.readyState === this.socket.OPEN) {
                this.socket.send(encodedMsg);
            }
            else {
                return Promise.reject(new Error(`Socket is not open`));
            }
            return promise;
        }
        close() {
            this.socket.close();
            return this.awaitClose();
        }
        awaitClose() {
            return new Promise((resolve) => this.socket.on('close', resolve));
        }
        static connect(url, signalCb) {
            return new Promise((resolve, reject) => {
                const socket = new isomorphic_ws_1.default(url);
                // make sure that there are no uncaught connection
                // errors because that causes nodejs thread to crash
                // with uncaught exception
                socket.onerror = (e) => {
                    reject(new Error(`could not connect to holochain conductor, please check that a conductor service is running and available at ${url}`));
                };
                socket.onopen = () => {
                    const hw = new WsClient(socket);
                    socket.onmessage = (encodedMsg) => __awaiter(this, void 0, void 0, function* () {
                        let data = encodedMsg.data;
                        // If data is not a buffer (nodejs), it will be a blob (browser)
                        if (typeof Buffer === "undefined" || !Buffer.isBuffer(data)) {
                            data = yield data.arrayBuffer();
                        }
                        const msg = msgpack.decode(data);
                        if (signalCb && msg.type === 'Signal') {
                            const decodedMessage = msgpack.decode(msg.data);
                            // Note: holochain currently returns signals as an array of two values: cellId and the seralized signal payload
                            // and this array is nested within the App key within the returned message.
                            const decodedCellId = decodedMessage.App[0];
                            // Note:In order to return readible content to the UI, the signal payload must also be decoded.
                            const decodedPayload = signalTransform(decodedMessage.App[1]);
                            // Return a uniform format to UI (ie: { type, data } - the same format as with callZome and appInfo...)
                            const signal = { type: msg.type, data: { cellId: decodedCellId, payload: decodedPayload } };
                            signalCb(signal);
                        }
                        else if (msg.type === 'Response') {
                            const id = msg.id;
                            if (hw.pendingRequests[id]) {
                                // resolve response
                                hw.pendingRequests[id].fulfill(msgpack.decode(msg.data));
                            }
                            else {
                                console.error(`Got response with no matching request. id=${id}`);
                            }
                        }
                        else {
                            console.error(`Got unrecognized Websocket message type: ${msg.type}`);
                        }
                    });
                    resolve(hw);
                };
            });
        }
    }
    exports.WsClient = WsClient;
    const signalTransform = (res) => {
        return msgpack.decode(res);
    };

    });

    var common = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.catchError = void 0;
    const ERROR_TYPE = 'error';
    exports.catchError = (res) => {
        return res.type === ERROR_TYPE
            ? Promise.reject(res)
            : Promise.resolve(res);
    };

    });

    var common$1 = createCommonjsModule(function (module, exports) {
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.requesterTransformer = void 0;
    /**
     * Take a Requester function which deals with tagged requests and responses,
     * and return a Requester which deals only with the inner data types, also
     * with the optional Transformer applied to further modify the input and output.
     */
    exports.requesterTransformer = (requester, tag, transform = identityTransformer) => ((req) => __awaiter(void 0, void 0, void 0, function* () {
        const input = { type: tag, data: transform.input(req) };
        const response = yield requester(input);
        const output = transform.output(response.data);
        return output;
    }));
    const identity = x => x;
    const identityTransformer = {
        input: identity,
        output: identity,
    };

    });

    var admin$1 = createCommonjsModule(function (module, exports) {
    /**
     * Defines AdminWebsocket, an easy-to-use websocket implementation of the
     * Conductor Admin API
     *
     *    const client = AdminWebsocket.connect(
     *      'ws://localhost:9000'
     *    )
     *
     *    client.generateAgentPubKey()
     *      .then(agentPubKey => {
     *        console.log('Agent successfully generated:', agentPubKey)
     *      })
     *      .catch(err => {
     *        console.error('problem generating agent:', err)
     *      })
     */
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AdminWebsocket = void 0;



    class AdminWebsocket {
        constructor(client) {
            this._requester = (tag, transformer) => common$1.requesterTransformer(req => this.client.request(req).then(common.catchError), tag, transformer);
            // the specific request/response types come from the Interface
            // which this class implements
            this.activateApp = this._requester('activate_app');
            this.attachAppInterface = this._requester('attach_app_interface');
            this.deactivateApp = this._requester('deactivate_app');
            this.dumpState = this._requester('dump_state', dumpStateTransform);
            this.generateAgentPubKey = this._requester('generate_agent_pub_key');
            this.installApp = this._requester('install_app');
            this.listDnas = this._requester('list_dnas');
            this.listCellIds = this._requester('list_cell_ids');
            this.listActiveApps = this._requester('list_active_apps');
            this.requestAgentInfo = this._requester('request_agent_info');
            this.addAgentInfo = this._requester('add_agent_info');
            this.client = client;
        }
        static connect(url) {
            return __awaiter(this, void 0, void 0, function* () {
                const wsClient = yield client.WsClient.connect(url);
                return new AdminWebsocket(wsClient);
            });
        }
    }
    exports.AdminWebsocket = AdminWebsocket;
    const dumpStateTransform = {
        input: (req) => req,
        output: (res) => {
            return JSON.parse(res);
        }
    };

    });

    var app$1 = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    });
    var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppWebsocket = void 0;
    /**
     * Defines AppWebsocket, an easy-to-use websocket implementation of the
     * Conductor API for apps
     *
     *    const client = AppWebsocket.connect(
     *      'ws://localhost:9000',
     *      signal => console.log('got a signal:', signal)
     *    )
     *
     *    client.callZome({...})  // TODO: show what's in here
     *      .then(() => {
     *        console.log('DNA successfully installed')
     *      })
     *      .catch(err => {
     *        console.error('problem installing DNA:', err)
     *      })
     */
    const msgpack = __importStar(require$$0);



    class AppWebsocket {
        constructor(client) {
            this._requester = (tag, transformer) => common$1.requesterTransformer(req => this.client.request(req).then(common.catchError), tag, transformer);
            this.appInfo = this._requester('app_info');
            this.callZome = this._requester('zome_call_invocation', callZomeTransform);
            this.client = client;
        }
        static connect(url, signalCb) {
            return __awaiter(this, void 0, void 0, function* () {
                const wsClient = yield client.WsClient.connect(url, signalCb);
                return new AppWebsocket(wsClient);
            });
        }
    }
    exports.AppWebsocket = AppWebsocket;
    const callZomeTransform = {
        input: (req) => {
            req.payload = msgpack.encode(req.payload);
            return req;
        },
        output: (res) => {
            return msgpack.decode(res);
        }
    };

    });

    var lib = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
        for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(admin, exports);
    __exportStar(app, exports);
    __exportStar(types, exports);
    __exportStar(admin$1, exports);
    __exportStar(app$1, exports);

    });

    class Zome {
      constructor(appClient, appId) {
        this.appClient = appClient;
        this.appId = appId;
      }

      async attach() {
        // setup the syn instance data
        this.appInfo = await this.appClient.appInfo({ installed_app_id: this.appId });
        this.cellId = this.appInfo.cell_data[0][0];
        this.agentPubKey = this.cellId[1];
        this.dna = this.cellId[0];
        this.dnaStr = bufferToBase64(this.dna);
        this.me = bufferToBase64(this.agentPubKey);
      }

      attached() {
        return this.appInfo != undefined
      }

      async call(fn_name, payload, timeout) {
        if (!this.attached()) {
          console.log("Can't call zome when disconnected from conductor");
          return
        }
        try {
          const zome_name = 'syn';
          console.log(`Making zome call ${fn_name} with:`, payload);
          const result = await this.appClient.callZome(
            {
              cap: null,
              cell_id: this.cellId,
              zome_name,
              fn_name,
              provenance: this.agentPubKey,
              payload
            },
            timeout
          );
          return result
        } catch (error) {
          console.log('ERROR: callZome threw error', error);
          throw(error)
          //  if (error == 'Error: Socket is not open') {
          // TODO        return doResetConnection(dispatch)
          // }
        }
      }

    }

    class Syn {
      constructor(defaultContent, applyDeltaFn, appClient, appId) {

        console.log('Syn constructor', applyDeltaFn);

        this.defaultContent = defaultContent,
        this.applyDeltaFn = applyDeltaFn,
        this.zome = new Zome(appClient, appId);
        this.session = session,
        this.folks = folks,
        this.connection = connection;
      }

      async attach() {
        await this.zome.attach();
        this.agentPubKey = this.zome.agentPubKey;
        this.me = this.zome.me;
        this.myColors = getFolkColors(this.agentPubKey);
        this.myTag = this.me.slice(-4);
        this.Dna = this.zome.dnaStr;

        // TODO: others moved into session so we can do it here.
        // load up the other folk in this syn instance
    //    let allFolks = await this.getFolks()
    //    for (const folk of allFolks) {
    //      this.updateOthers(folk)
    //    }

      }

      clearState() {
        this.folks.set({});
        this.connection.set(undefined);
        this.session.update(s => {
          s.scribeStr.set('');
          s._content = this.defaultContent;
          s.content.set(s._content);
          s.requestedChanges.set([]);
          s.recordedChanges.set([]);
          s.committedChanges.set([]);
          return undefined
        });
      }

      async callZome(fn_name, payload, timeout) {
        return this.zome.call(fn_name, payload, timeout)
      }

      async getFolks() {
        return this.callZome('get_folks')
      }

      async getSessions() {
        return this.callZome('get_sessions')
      }

      setSession(sessionInfo) {
        let s = new Session(this, sessionInfo);
        this._session = s;
        this.session.set(s);
        return s
      }

      async getSession(session_hash) {
        return this.callZome('get_session', session_hash)
      }

      async newSession() {
        let rawSessionInfo = await this.callZome('new_session', {content: this.defaultContent});
        let s = this.setSession(rawSessionInfo);
        return s
      }

      async sendSyncReq() {
        return this.callZome('send_sync_request', {scribe: this._session.scribe})
      }

    }

    const FOLK_SEEN = 1;
    const FOLK_GONE = 2;
    const FOLK_UNKNOWN = 3;
    // const outOfSessionTimout = 30 * 1000
    const outOfSessionTimout = 8 * 1000; // testing code :)

    // const heartbeatInterval = 15 * 1000 // 15 seconds
    const heartbeatInterval = 30  * 1000; // for testing ;)
    let reqTimeout = 1000;

    class Session {
      initTimers(syn) {
        var self = this;
        // Send heartbeat to scribe every [heartbeat interval]
        this.heart = setInterval(async () => {
          if (self._scribeStr == self.me) {
            // examine folks last seen time and see if any have crossed the session out-of-session
            // timeout so we can tell everybody else about them having dropped.
            let gone = self.updateRecentlyTimedOutFolks();
            if (gone.length > 0) {
              self.sendFolkLore(self.folksForScribeSignals(), {gone});
            }
          } else {
              // I'm not the scribe so send them a heartbeat
            await self.sendHeartbeat('Hello');
          }
        }, heartbeatInterval);

        this.requestChecker = setInterval(async () => {
          if (self.requested.length > 0) {
            if ((Date.now() - self.requested[0].at) > reqTimeout) {
              // for now let's just do the most drastic thing!
              /*
                console.log('requested change timed out! Undoing all changes', $requestedChanges[0])
                // TODO: make sure this is transactional and no requestChanges squeak in !
                while ($requestedChanges.length > 0) {
                requestedChanges.update(changes => {
                const change = changes.pop()
                console.log('undoing ', change)
                const undoDelta = undoFn(change)
                console.log('undoDelta: ', undoDelta)
                applyDeltaFn(undoDelta)
                return changes
                })
                }*/

              // and send a sync request incase something just got out of sequence
              // TODO: prepare for shifting to new scribe if they went offline

              this.initState(await syn.getSession(self.sessionHash));
              console.log("HERE");
              syn.sendSyncReq();
            }
          }
        }, reqTimeout/2);

      }

      initState(sessionInfo) {
        this.sessionHash = sessionInfo.session;
        this.scribe = sessionInfo.scribe;
        this.snapshot_content = sessionInfo.snapshot_content;
        this.snapshot_hash = sessionInfo.snapshot_hash;
        this.content_hash = sessionInfo.content_hash;

        this.deltas = sessionInfo.deltas.map(d => JSON.parse(d));
        this.snapshotHashStr = bufferToBase64(sessionInfo.snapshot_hash);
        this.contentHashStr = bufferToBase64(sessionInfo.content_hash);
        this._scribeStr = bufferToBase64(sessionInfo.scribe);
        this.scribeStr.set(this._scribeStr);

        this.recorded = [];
        this.requested = [];
        this.requestedChanges.set(this.requested);
        this.recordedChanges.set(this.recorded);
        this.committedChanges.set([]);
        this.reqCounter = 0;

        this.committed = [];
        let newContent = {... sessionInfo.snapshot_content}; // clone so as not to pass by ref
        newContent.meta = {};
        newContent.meta[this.myTag] = 0;

        for (const delta of this.deltas) {
          const [c, change] = this.applyDeltaFn(newContent, delta);
          newContent = c;
          this.committed.push(change);
        }
        this.committedChanges.set(this.committed);

        this._content = newContent;
        this.content.set(this._content);
      }

      constructor(syn, sessionInfo) {
        this.zome = syn.zome;
        this.applyDeltaFn = syn.applyDeltaFn;
        this.me = syn.zome.me;
        this.myTag = syn.zome.me.slice(-4);

        // set up the svelte based state vars
        this.content = content;
        this.folks = folks;
        this.recordedChanges = recordedChanges;
        this.requestedChanges = requestedChanges;
        this.committedChanges = committedChanges;
        this.scribeStr = scribeStr;

        this.others = {};
        this.folks.set(this.others);

        this.initState(sessionInfo);
        this.initTimers(syn);
        console.log('session joined:', sessionInfo);

      }

      _recordDelta(delta) {
        // apply the deltas to the content which returns the undoable change
        const undoableChange = this._runApplyDelta(delta);
        // append changes to the recorded history
        this.recorded.push(undoableChange);
        this.recordedChanges.set(this.recorded);
      }

      _recordDeltas(deltas) {
        // apply the deltas to the content which returns the undoable change
        for (const delta of deltas) {
          this._recordDelta(delta);
        }
      }


      // apply changes confirmed as recorded by the scribe while reconciling
      // and possibly rebasing our requested changes
      recordDeltas(index, deltas) {
        console.log("recordDeltas REQUESTED", this.requested);
        for (const delta of deltas) {
          if (this.requested.length > 0) {
            // if this change is our next requested change then remove it
            if (JSON.stringify(delta) == JSON.stringify(this.requested[0].delta)) {
              this.recorded.push(this.requested.shift());
              this.recordedChanges.set(this.recorded);
              this.requestedChanges.set(this.requested);
            } else {
              // TODO rebase?
              console.log('REBASE NEEDED?');
              console.log('requested ', this.requested[0].delta);
              console.log('to be recorded ', delta);
            }
          } else {
            // no requested changes so this must be from someone else so we don't have
            // to check our requested changes
            // TODO: do we need to check if this is a change that we did send and have already
            // integrated somehow and ignore if so.  (Seems unlikely?)
            this._recordDelta(delta);
          }
        }
      }

      nextIndex() {
        return this.recorded.length
      }

      _runApplyDelta(delta) { 
        const [newContent, undoableChange] = this.applyDeltaFn(this._content, delta);
        this._content = newContent;
        this.content.set(this._content);
        return undoableChange
      }

      // called when requesting a change to the content as a result of user action
      // If we are the scribe, no need to go into the zome
      // TODO: prevent reentry
      requestChange(deltas) {
        // any requested made by the scribe should be recorded immediately
        if (this._scribeStr == this.me) {
          const index = this.nextIndex();
          this._recordDeltas(deltas);
          this.sendChange(index,deltas);
        } else {
          // otherwise apply the change and queue it to requested changes for
          // confirmation later and send request change to scribe

          // create a unique id for each change
          // TODO: this should be part of actual changeReqs
          const changeId = this.myTag+'.'+this.reqCounter;
          const changeAt = Date.now();

          // we want to apply this to current nextIndex plus any previously
          // requested changes that haven't yet be recorded
          const index = this.nextIndex() + this.requested.length;

          for (const delta of deltas) {
            const undoableChange = this._runApplyDelta(delta);
            undoableChange.id = changeId;
            undoableChange.at = changeAt;
            // append changes to the requested queue
            this.requested.push(undoableChange);
            this.requestedChanges.set(this.requested);
          }
          console.log("REQUESTED", this.requested);
          this.sendChangeReq(index, deltas);
          this.reqCounter+= 1;
        }
      }

      addChangeAsScribe(change) {
        let [index, deltas] = change;
        const nextIndex = this.nextIndex();
        if (nextIndex != index) {
          console.log('Scribe is receiving change out of order!');
          console.log(`nextIndex: ${nextIndex}, changeIndex:${index} for deltas:`, deltas);

          if (index < nextIndex) {
            // change is too late, nextIndex has moved on
            // TODO: rebase? notify sender?
            return
          } else {
            // change is in the future, possibly some other change was dropped or is slow in arriving
            // TODO: wait a bit?  Ask sender for other changes?
            return
          }
        }

        this.recordDeltas(index, deltas);

        // notify all participants of the change
        this.sendChange(index, deltas);
      }

      async commitChange() {
        if (this._scribeStr == this.me) {
          if (this.recorded.length == 0) {
            alert('No changes to commit!');
            return
          }
          this.commitInProgress = true;

          const newContentHash = await this.hashContent(this._content);
          console.log('commiting from snapshot', this.snapshotHashStr);
          console.log('  prev_hash:', this.contentHashStr);
          console.log('   new_hash:', bufferToBase64(newContentHash));
          const commit = {
            snapshot: this.snapshot_hash,
            change: {
              deltas: this.recorded.map(c=>JSON.stringify(c.delta)),
              content_hash: newContentHash,
              previous_change: this.content_hash,
              meta: {
                contributors: [],
                witnesses: [],
                app_specific: null
              }
            },
            participants: this.folksForScribeSignals()
          };
          try {
            this.currentCommitHeaderHash = await this.zome.call('commit', commit);
            // if commit successfull we need to update the content hash and its string in the session
            this.content_hash = newContentHash;
            this.contentHashStr = bufferToBase64(this.content_hash);
            this.committed = this.committed.concat(this.recorded);
            this.recorded = [];
            this.recordedChanges.set(this.recorded);
            this.committedChanges.set(this.committed);
          }
          catch (e) {
            console.log("Error:", e);
          }
          this.commitInProgress = false;
        } else {
          alert("You ain't the scribe!");
        }
      }



      // Folks --------------------------------------------------------

      _newOther(pubKeyStr, pubKey) {
        if (!(pubKeyStr in this.others)) {
          const colors = getFolkColors(pubKey);
          this.others[pubKeyStr] = {pubKey, colors};
        }
      }

      updateOthers(pubKey, status, meta) {
        const pubKeyStr = bufferToBase64(pubKey);
        if (pubKeyStr == this.me) {
          return
        }

        // if we don't have this key, create a record for it
        // including the default color
        this._newOther(pubKeyStr, pubKey);


        if (meta) {
          this.others[pubKeyStr]["meta"] = meta;
        }

        switch(status) {
        case FOLK_SEEN:
          this.others[pubKeyStr]["inSession"] = true;
          this.others[pubKeyStr]["lastSeen"] = Date.now();
          break;
        case FOLK_GONE:
        case FOLK_UNKNOWN:
          this.others[pubKeyStr]["inSession"] = false;
        }

        this.folks.set(this.others);
      }

      folksForScribeSignals() {
        return Object.values(this.others).filter(v=>v.inSession).map(v=>v.pubKey)
      }

      // updates folks in-session status by checking their last-seen time
      updateRecentlyTimedOutFolks() {
        let result = [];
        for (const [pubKeyStr, folk] of Object.entries(this.others)) {
          if (folk.inSession && (Date.now() - this.others[pubKeyStr].lastSeen > outOfSessionTimout)) {
            folk.inSession = false;
            result.push(this.others[pubKeyStr].pubKey);
          }
        }
        if (result.length > 0) {
          this.folks.set(this.others);
        }
        return result
      }

      async hashContent(content) {
        return this.zome.call('hash_content', content)
      }

      // senders ---------------------------------------------------------------------
      // These are the functions that send signals in the context of a session

      async sendHeartbeat(data) {
        data = encodeJson(data);
        return this.zome.call('send_heartbeat', {scribe: this.scribe, data})
      }

      async sendChangeReq(index, deltas) {
        deltas = deltas.map(d=>JSON.stringify(d));
        return this.zome.call('send_change_request', {scribe: this.scribe, change: [index, deltas]})
      }


      async sendChange(index, deltas) {
        const participants = this.folksForScribeSignals();
        if (participants.length > 0) {
          deltas = deltas.map(d=>JSON.stringify(d));
          return this.zome.call('send_change', {participants, change: [index, deltas]})
        }
      }

      async sendFolkLore(participants, data) {
        if (participants.length > 0) {
          data = encodeJson(data);
          return this.zome.call('send_folk_lore', {participants, data})
        }
      }

      async sendSyncResp(to, state) {
        state.deltas = state.deltas.map(d=>JSON.stringify(d));
        return this.zome.call('send_sync_response', {
          participant: to,
          state
        })
      }


      // signal handlers ------------------------------------------


      // handler for the changeReq event
      changeReq(change) {
        if (this._scribeStr == this.me) {
          this.addChangeAsScribe(change);
        } else {
          console.log("change requested but I'm not the scribe.");
        }
      }

      // handler for the change event
      change(index, deltas) {
        if (this._scribeStr == this.me) {
          console.log("change received but I'm the scribe, so I'm ignoring this!");
        } else {
          console.log(`change arrived for ${index}:`, deltas);
          if (this.nextIndex() == index) {
            this.recordDeltas(index, deltas);
          } else {
            console.log(`change arrived out of sequence nextIndex: ${this.nextIndex()}, change index:${index}`);
            // TODO either call for sync, or do some waiting algorithm
          }
        }
      }

      // handler for the syncReq event
      syncReq(request) {
        const from = request.from;
        if (this._scribeStr == this.me) {
          this.updateOthers(from, FOLK_SEEN, request.meta);
          let state = {
            snapshot: this.snapshot_hash,
            commit_content_hash: this.content_hash,
            deltas: this.recorded.map(c => c.delta)
          };
          if (this.currentCommitHeaderHash) {
            state['commit'] = this.currentCommitHeaderHash;
          }
          // send a sync response to the sender
          this.sendSyncResp(from, state);
          // and send everybody a folk lore p2p message with new participants
          let p = {...this.others};
          p[this.me] = {
            pubKey: this.zome.agentPubKey
          };
          const data = {
            participants: p
          };
          this.sendFolkLore(this.folksForScribeSignals(), data);
        }
        else {
          console.log("syncReq received but I'm not the scribe!");
        }
      }

      // handler for the syncResp event
      syncResp(stateForSync) {
        // Make sure that we are working off the same snapshot and commit
        const commitContentHashStr = bufferToBase64(stateForSync.commit_content_hash);
        if (commitContentHashStr == this.contentHashStr) {
          this._recordDeltas(stateForSync.deltas);
        } else {
          console.log('WHOA, sync response has different current state assumptions');
          // TODO: resync somehow
        }
      }

      // handler for the heartbeat event
      heartbeat(from, data) {
        console.log('got heartbeat', data, 'from:', from);
        if (this._scribeStr != this.me) {
          console.log("heartbeat received but I'm not the scribe.");
        }
        else {
          // I am the scribe and I've recieved a heartbeat from a concerned Folk
          this.updateOthers(from, FOLK_SEEN);
        }
      }

      // handler for the folklore event
      folklore(data) {
        console.log('got folklore', data);
        if (this._scribeStr == this.me) {
          console.log("folklore received but I'm the scribe!");
        }
        else {
          if (data.gone) {
            Object.values(data.participants).forEach(
              pubKey => {
                this.updateOthers(pubKey, FOLK_GONE);
              }
            );
          }
          // TODO move last seen into p.meta so that we can update that value
          // as hearsay.
          if (data.participants) {
            Object.values(data.participants).forEach(
              p => {
                this.updateOthers(p.pubKey, FOLK_UNKNOWN, p.meta);
              }
            );
          }
        }
      }

      // handler for the commit notice event
      commitNotice(commitInfo) {
        // make sure we are at the right place to be able to just move forward with the commit
        if (this.contentHashStr == bufferToBase64(commitInfo.previous_content_hash) &&
            this.nextIndex() == commitInfo.deltas_committed) {
          this.contentHashStr = bufferToBase64(commitInfo.commit_content_hash);
          this.committed = this.committed.concat(this.recorded);
          this.recorded = [];
          this.committedChanges.set(this.committed);
          this.recordedChanges.set(this.recorded);
        } else {
          console.log('received commit notice for beyond our last commit, gotta resync');
          console.log('commit.commit_content_hash:', bufferToBase64(commitInfo.commit_content_hash));
          console.log('commit.previous_content_hash:', bufferToBase64(commitInfo.previous_content_hash));
          console.log('commit.deltas_committed:', commitInfo.deltas_committed);
          console.log('my $session.contentHashStr', this.contentHashStr);
          console.log('my nextIndex', this.nextIndex());
          // TODO resync
        }
      }
    }

    class Connection {
      constructor(appPort, appId) {
        this.appPort = appPort;
        this.appId = appId;
        this.sessions = [];
      }

      async open(defaultContent, applyDeltaFn) {

        console.log('connection', applyDeltaFn);

        var self = this;
        this.appClient = await lib.AppWebsocket.connect(
          `ws://localhost:${this.appPort}`,
          (signal) => signalHandler(self, signal));

        console.log('connection established:', this);

        // TODO: in the future we should be able manage and to attach to multiple syn happs
        this.syn = new Syn(defaultContent, applyDeltaFn, this.appClient, this.appId);
        await this.syn.attach(this.appId);
        this.sessions = await this.syn.getSessions();
      }

      async joinSession() {
        if (!this.syn ) {
          console.log("join session called without syn app opened");
          return
        }
        if (this.sessions.length == 0) {
          this.session = await this.syn.newSession();
          this.sessions[0] = this.session.sessionHash;
        } else {
          const sessionInfo = await this.syn.getSession(this.sessions[0]);
          this.session = this.syn.setSession(sessionInfo);
          if (this.session._scribeStr != this.syn.me) {
            await this.syn.sendSyncReq();
          }
        }
      }
    }

    function signalHandler(connection, signal) {
      // ignore signals not meant for me
      if (!connection.syn || bufferToBase64(signal.data.cellId[1]) != connection.syn.me) {
        return
      }
      console.log('Got Signal', signal.data.payload.signal_name, signal);
      switch (signal.data.payload.signal_name) {
      case 'SyncReq':
        connection.session.syncReq({from: signal.data.payload.signal_payload});
        break
      case 'SyncResp':
        const state = signal.data.payload.signal_payload;
        state.deltas = state.deltas.map(d=>JSON.parse(d));
        connection.session.syncResp(state);
        break
      case 'ChangeReq':
        {
          let [index, deltas] = signal.data.payload.signal_payload;
          deltas = deltas.map(d=>JSON.parse(d));
          connection.session.changeReq([index, deltas]);
          break
        }
      case 'Change':
        {
          let [index, deltas] = signal.data.payload.signal_payload;
          deltas = deltas.map(d=>JSON.parse(d));
          connection.session.change(index, deltas);
          break
        }
      case 'FolkLore':
        {
          let data = decodeJson(signal.data.payload.signal_payload);
          connection.session.folklore(data);
          break
        }
      case 'Heartbeat':
        {
          let [from, jsonData] = signal.data.payload.signal_payload;
          const data = decodeJson(jsonData);
          connection.session.heartbeat(from, data);
          break
        }
      case 'CommitNotice':
        connection.session.commitNotice(signal.data.payload.signal_payload);
      }
    }

    /* src/Syn.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file$4 = "src/Syn.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (90:4) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Connect");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(90:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (88:4) {#if $connection}
    function create_if_block_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disconnect");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(88:4) {#if $connection}",
    		ctx
    	});

    	return block;
    }

    // (98:2) {#if sessions}
    function create_if_block$4(ctx) {
    	let each_1_anchor;
    	let each_value = /*sessions*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bufferToBase64, sessions*/ 1) {
    				each_value = /*sessions*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(98:2) {#if sessions}",
    		ctx
    	});

    	return block;
    }

    // (99:2) {#each sessions as session}
    function create_each_block$2(ctx) {
    	let span;
    	let t0;
    	let t1_value = bufferToBase64(/*session*/ ctx[5]).slice(-4) + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Id: ");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "class", "session svelte-18zdx2q");
    			add_location(span, file$4, 99, 4, 2120);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sessions*/ 1 && t1_value !== (t1_value = bufferToBase64(/*session*/ ctx[5]).slice(-4) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(99:2) {#each sessions as session}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let button0;
    	let t1;
    	let div0;
    	let h4;
    	let t3;
    	let input0;
    	let t4;
    	let input1;
    	let t5;
    	let button1;
    	let t6;
    	let div1;
    	let t7;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$connection*/ ctx[3]) return create_if_block_1$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*sessions*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Commit";
    			t1 = space();
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Holochain Connection:";
    			t3 = text("\n  App Port: ");
    			input0 = element("input");
    			t4 = text("\n  AppId: ");
    			input1 = element("input");
    			t5 = space();
    			button1 = element("button");
    			if_block0.c();
    			t6 = space();
    			div1 = element("div");
    			t7 = text("Sessions:\n  ");
    			if (if_block1) if_block1.c();
    			attr_dev(button0, "class", "svelte-18zdx2q");
    			toggle_class(button0, "noscribe", /*noscribe*/ ctx[4]);
    			add_location(button0, file$4, 80, 0, 1730);
    			add_location(h4, file$4, 83, 2, 1802);
    			attr_dev(input0, "class", "svelte-18zdx2q");
    			add_location(input0, file$4, 84, 12, 1845);
    			attr_dev(input1, "class", "svelte-18zdx2q");
    			add_location(input1, file$4, 85, 9, 1883);
    			attr_dev(button1, "class", "svelte-18zdx2q");
    			add_location(button1, file$4, 86, 2, 1912);
    			add_location(div0, file$4, 82, 0, 1794);
    			attr_dev(div1, "class", "sessions");
    			add_location(div1, file$4, 95, 0, 2034);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h4);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*appPort*/ ctx[1]);
    			append_dev(div0, t4);
    			append_dev(div0, input1);
    			set_input_value(input1, /*appId*/ ctx[2]);
    			append_dev(div0, t5);
    			append_dev(div0, button1);
    			if_block0.m(button1, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t7);
    			if (if_block1) if_block1.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*commitChange*/ ctx[7], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
    					listen_dev(button1, "click", /*toggle*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*noscribe*/ 16) {
    				toggle_class(button0, "noscribe", /*noscribe*/ ctx[4]);
    			}

    			if (dirty & /*appPort*/ 2 && input0.value !== /*appPort*/ ctx[1]) {
    				set_input_value(input0, /*appPort*/ ctx[1]);
    			}

    			if (dirty & /*appId*/ 4 && input1.value !== /*appId*/ ctx[2]) {
    				set_input_value(input1, /*appId*/ ctx[2]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button1, null);
    				}
    			}

    			if (/*sessions*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if_block0.d();
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $session,
    		$$unsubscribe_session = noop,
    		$$subscribe_session = () => ($$unsubscribe_session(), $$unsubscribe_session = subscribe(session, $$value => $$invalidate(14, $session = $$value)), session);

    	let $connection;
    	let $scribeStr;
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, $$value => $$invalidate(3, $connection = $$value));
    	validate_store(scribeStr, "scribeStr");
    	component_subscribe($$self, scribeStr, $$value => $$invalidate(11, $scribeStr = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_session());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Syn", slots, []);
    	let session;
    	let { applyDeltaFn } = $$props;
    	let { undoFn } = $$props;

    	// this is the list of sessions returned by the DNA
    	let sessions;

    	function requestChange(deltas) {
    		$session.requestChange(deltas);
    	}

    	// -----------------------------------------------------------------------
    	const dispatch = createEventDispatcher();

    	let adminPort = 1234;
    	let appPort = 8888;
    	let appId = "syn";

    	async function toggle() {
    		if (!$connection) {
    			set_store_value(connection, $connection = new Connection(appPort, appId), $connection);
    			await $connection.open({ ...emptySession }, applyDeltaFn);
    			$$subscribe_session($$invalidate(5, session = $connection.syn.session));
    			console.log("joining session...");
    			await $connection.joinSession();
    			$$invalidate(0, sessions = $connection.sessions);
    		} else {
    			$connection.syn.clearState();
    			$$invalidate(0, sessions = undefined);
    			console.log("disconnected");
    		}
    	}

    	async function commitChange() {
    		$session.commitChange();
    	}

    	const writable_props = ["applyDeltaFn", "undoFn"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Syn> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		appPort = this.value;
    		$$invalidate(1, appPort);
    	}

    	function input1_input_handler() {
    		appId = this.value;
    		$$invalidate(2, appId);
    	}

    	$$self.$$set = $$props => {
    		if ("applyDeltaFn" in $$props) $$invalidate(8, applyDeltaFn = $$props.applyDeltaFn);
    		if ("undoFn" in $$props) $$invalidate(9, undoFn = $$props.undoFn);
    	};

    	$$self.$capture_state = () => ({
    		connection,
    		scribeStr,
    		content,
    		folks,
    		createEventDispatcher,
    		Connection,
    		bufferToBase64,
    		emptySession,
    		session,
    		applyDeltaFn,
    		undoFn,
    		sessions,
    		requestChange,
    		dispatch,
    		adminPort,
    		appPort,
    		appId,
    		toggle,
    		commitChange,
    		$session,
    		$connection,
    		noscribe,
    		$scribeStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("session" in $$props) $$subscribe_session($$invalidate(5, session = $$props.session));
    		if ("applyDeltaFn" in $$props) $$invalidate(8, applyDeltaFn = $$props.applyDeltaFn);
    		if ("undoFn" in $$props) $$invalidate(9, undoFn = $$props.undoFn);
    		if ("sessions" in $$props) $$invalidate(0, sessions = $$props.sessions);
    		if ("adminPort" in $$props) adminPort = $$props.adminPort;
    		if ("appPort" in $$props) $$invalidate(1, appPort = $$props.appPort);
    		if ("appId" in $$props) $$invalidate(2, appId = $$props.appId);
    		if ("noscribe" in $$props) $$invalidate(4, noscribe = $$props.noscribe);
    	};

    	let noscribe;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$scribeStr*/ 2048) {
    			 $$invalidate(4, noscribe = $scribeStr === "");
    		}
    	};

    	return [
    		sessions,
    		appPort,
    		appId,
    		$connection,
    		noscribe,
    		session,
    		toggle,
    		commitChange,
    		applyDeltaFn,
    		undoFn,
    		requestChange,
    		$scribeStr,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Syn$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			applyDeltaFn: 8,
    			undoFn: 9,
    			requestChange: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Syn",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*applyDeltaFn*/ ctx[8] === undefined && !("applyDeltaFn" in props)) {
    			console_1.warn("<Syn> was created without expected prop 'applyDeltaFn'");
    		}

    		if (/*undoFn*/ ctx[9] === undefined && !("undoFn" in props)) {
    			console_1.warn("<Syn> was created without expected prop 'undoFn'");
    		}
    	}

    	get applyDeltaFn() {
    		throw new Error("<Syn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set applyDeltaFn(value) {
    		throw new Error("<Syn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get undoFn() {
    		throw new Error("<Syn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set undoFn(value) {
    		throw new Error("<Syn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get requestChange() {
    		return this.$$.ctx[10];
    	}

    	set requestChange(value) {
    		throw new Error("<Syn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Debug.svelte generated by Svelte v3.31.0 */
    const file$5 = "src/Debug.svelte";

    // (14:6) {:else}
    function create_else_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("No connection");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(14:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:6) {#if $connection && $connection.syn}
    function create_if_block$5(ctx) {
    	let t0;
    	let t1_value = /*$connection*/ ctx[0].syn.Dna + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Connected to Dna: ");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$connection*/ 1 && t1_value !== (t1_value = /*$connection*/ ctx[0].syn.Dna + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(12:6) {#if $connection && $connection.syn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let ul;
    	let li0;
    	let t0;
    	let li1;
    	let t1;

    	let t2_value = (/*$session*/ ctx[1]
    	? /*$session*/ ctx[1].contentHashStr
    	: "") + "";

    	let t2;
    	let t3;
    	let li2;
    	let t4;
    	let t5_value = JSON.stringify(/*$session*/ ctx[1]) + "";
    	let t5;
    	let t6;
    	let li3;
    	let t7;
    	let t8;
    	let t9;
    	let li4;
    	let t10;
    	let t11;

    	function select_block_type(ctx, dirty) {
    		if (/*$connection*/ ctx[0] && /*$connection*/ ctx[0].syn) return create_if_block$5;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			if_block.c();
    			t0 = space();
    			li1 = element("li");
    			t1 = text("lastCommitedContentHash: ");
    			t2 = text(t2_value);
    			t3 = space();
    			li2 = element("li");
    			t4 = text("session: ");
    			t5 = text(t5_value);
    			t6 = space();
    			li3 = element("li");
    			t7 = text("nextIndex: ");
    			t8 = text(/*$nextIndex*/ ctx[2]);
    			t9 = space();
    			li4 = element("li");
    			t10 = text("scribe: ");
    			t11 = text(/*$scribeStr*/ ctx[3]);
    			add_location(li0, file$5, 10, 4, 157);
    			add_location(li1, file$5, 16, 4, 305);
    			add_location(li2, file$5, 17, 4, 380);
    			add_location(li3, file$5, 18, 4, 424);
    			add_location(li4, file$5, 19, 4, 456);
    			attr_dev(ul, "class", "svelte-tgi576");
    			add_location(ul, file$5, 9, 2, 148);
    			add_location(div, file$5, 8, 0, 140);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			if_block.m(li0, null);
    			append_dev(li0, t0);
    			append_dev(ul, li1);
    			append_dev(li1, t1);
    			append_dev(li1, t2);
    			append_dev(li1, t3);
    			append_dev(ul, li2);
    			append_dev(li2, t4);
    			append_dev(li2, t5);
    			append_dev(li2, t6);
    			append_dev(ul, li3);
    			append_dev(li3, t7);
    			append_dev(li3, t8);
    			append_dev(li3, t9);
    			append_dev(ul, li4);
    			append_dev(li4, t10);
    			append_dev(li4, t11);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(li0, t0);
    				}
    			}

    			if (dirty & /*$session*/ 2 && t2_value !== (t2_value = (/*$session*/ ctx[1]
    			? /*$session*/ ctx[1].contentHashStr
    			: "") + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$session*/ 2 && t5_value !== (t5_value = JSON.stringify(/*$session*/ ctx[1]) + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*$nextIndex*/ 4) set_data_dev(t8, /*$nextIndex*/ ctx[2]);
    			if (dirty & /*$scribeStr*/ 8) set_data_dev(t11, /*$scribeStr*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $connection;
    	let $session;
    	let $nextIndex;
    	let $scribeStr;
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, $$value => $$invalidate(0, $connection = $$value));
    	validate_store(session, "session");
    	component_subscribe($$self, session, $$value => $$invalidate(1, $session = $$value));
    	validate_store(nextIndex, "nextIndex");
    	component_subscribe($$self, nextIndex, $$value => $$invalidate(2, $nextIndex = $$value));
    	validate_store(scribeStr, "scribeStr");
    	component_subscribe($$self, scribeStr, $$value => $$invalidate(3, $scribeStr = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Debug", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Debug> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		session,
    		connection,
    		scribeStr,
    		nextIndex,
    		$connection,
    		$session,
    		$nextIndex,
    		$scribeStr
    	});

    	return [$connection, $session, $nextIndex, $scribeStr];
    }

    class Debug extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Debug",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/HistoryEntry.svelte generated by Svelte v3.31.0 */

    const file$6 = "src/HistoryEntry.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let t;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(div, "class", div_class_value = "history-entry " + /*status*/ ctx[1] + " svelte-1led4hq");
    			add_location(div, file$6, 27, 0, 474);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);

    			if (dirty & /*status*/ 2 && div_class_value !== (div_class_value = "history-entry " + /*status*/ ctx[1] + " svelte-1led4hq")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HistoryEntry", slots, []);
    	let { text } = $$props;
    	let { status } = $$props;
    	const writable_props = ["text", "status"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HistoryEntry> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("status" in $$props) $$invalidate(1, status = $$props.status);
    	};

    	$$self.$capture_state = () => ({ text, status });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("status" in $$props) $$invalidate(1, status = $$props.status);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, status];
    }

    class HistoryEntry extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { text: 0, status: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HistoryEntry",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<HistoryEntry> was created without expected prop 'text'");
    		}

    		if (/*status*/ ctx[1] === undefined && !("status" in props)) {
    			console.warn("<HistoryEntry> was created without expected prop 'status'");
    		}
    	}

    	get text() {
    		throw new Error("<HistoryEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<HistoryEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get status() {
    		throw new Error("<HistoryEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<HistoryEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/History.svelte generated by Svelte v3.31.0 */
    const file$7 = "src/History.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (58:4) {#each historyEntries as historyEntry}
    function create_each_block$3(ctx) {
    	let historyentry;
    	let current;

    	historyentry = new HistoryEntry({
    			props: {
    				status: /*historyEntry*/ ctx[9].status,
    				text: /*historyEntry*/ ctx[9].text
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(historyentry.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(historyentry, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const historyentry_changes = {};
    			if (dirty & /*historyEntries*/ 1) historyentry_changes.status = /*historyEntry*/ ctx[9].status;
    			if (dirty & /*historyEntries*/ 1) historyentry_changes.text = /*historyEntry*/ ctx[9].text;
    			historyentry.$set(historyentry_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(historyentry.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(historyentry.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(historyentry, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(58:4) {#each historyEntries as historyEntry}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let current;
    	let each_value = /*historyEntries*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t = text("History:\n  ");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "history-entries svelte-ywa4w4");
    			add_location(div0, file$7, 56, 2, 1591);
    			attr_dev(div1, "class", "history svelte-ywa4w4");
    			add_location(div1, file$7, 54, 0, 1556);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*historyEntries*/ 1) {
    				each_value = /*historyEntries*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $requestedChanges;
    	let $recordedChanges;
    	let $committedChanges;
    	validate_store(requestedChanges, "requestedChanges");
    	component_subscribe($$self, requestedChanges, $$value => $$invalidate(5, $requestedChanges = $$value));
    	validate_store(recordedChanges, "recordedChanges");
    	component_subscribe($$self, recordedChanges, $$value => $$invalidate(6, $recordedChanges = $$value));
    	validate_store(committedChanges, "committedChanges");
    	component_subscribe($$self, committedChanges, $$value => $$invalidate(7, $committedChanges = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("History", slots, []);
    	let { changeToTextFn } = $$props;

    	// returns a list of historyEntry objects with some text
    	// and a status (for styling)
    	function changesToEntriesList(changes, status) {
    		let entriesList = [];

    		for (let i = changes.length - 1; i >= 0; i--) {
    			const text = changeToTextFn(changes[i]);
    			entriesList.push({ text, status });
    		}

    		return entriesList;
    	}

    	let requestedH;
    	let recordedH;
    	let committedH;
    	let historyEntries = [];

    	// when updating the list, also scroll to the newest historyEntry
    	afterUpdate(async () => {
    		let entryElem = document.getElementsByClassName("history-entries")[0];

    		if (entryElem.firstChild !== null) {
    			entryElem.firstChild.scrollIntoView(false);
    		}
    	});

    	const writable_props = ["changeToTextFn"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<History> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("changeToTextFn" in $$props) $$invalidate(1, changeToTextFn = $$props.changeToTextFn);
    	};

    	$$self.$capture_state = () => ({
    		requestedChanges,
    		recordedChanges,
    		committedChanges,
    		afterUpdate,
    		HistoryEntry,
    		changeToTextFn,
    		changesToEntriesList,
    		requestedH,
    		recordedH,
    		committedH,
    		historyEntries,
    		$requestedChanges,
    		$recordedChanges,
    		$committedChanges
    	});

    	$$self.$inject_state = $$props => {
    		if ("changeToTextFn" in $$props) $$invalidate(1, changeToTextFn = $$props.changeToTextFn);
    		if ("requestedH" in $$props) $$invalidate(2, requestedH = $$props.requestedH);
    		if ("recordedH" in $$props) $$invalidate(3, recordedH = $$props.recordedH);
    		if ("committedH" in $$props) $$invalidate(4, committedH = $$props.committedH);
    		if ("historyEntries" in $$props) $$invalidate(0, historyEntries = $$props.historyEntries);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$requestedChanges*/ 32) {
    			 {
    				$$invalidate(2, requestedH = changesToEntriesList($requestedChanges, "requested"));
    			}
    		}

    		if ($$self.$$.dirty & /*$recordedChanges*/ 64) {
    			 {
    				$$invalidate(3, recordedH = changesToEntriesList($recordedChanges, "recorded"));
    			}
    		}

    		if ($$self.$$.dirty & /*$committedChanges*/ 128) {
    			 {
    				$$invalidate(4, committedH = changesToEntriesList($committedChanges, "committed"));
    			}
    		}

    		if ($$self.$$.dirty & /*requestedH, recordedH, committedH*/ 28) {
    			 {
    				$$invalidate(0, historyEntries = [...requestedH, ...recordedH, ...committedH]);
    			}
    		}
    	};

    	return [
    		historyEntries,
    		changeToTextFn,
    		requestedH,
    		recordedH,
    		committedH,
    		$requestedChanges,
    		$recordedChanges,
    		$committedChanges
    	];
    }

    class History extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { changeToTextFn: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "History",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*changeToTextFn*/ ctx[1] === undefined && !("changeToTextFn" in props)) {
    			console.warn("<History> was created without expected prop 'changeToTextFn'");
    		}
    	}

    	get changeToTextFn() {
    		throw new Error("<History>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set changeToTextFn(value) {
    		throw new Error("<History>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    const { document: document_1 } = globals;
    const file$8 = "src/App.svelte";

    function create_fragment$8(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let div0;
    	let h1;
    	let t2;
    	let main;
    	let div1;
    	let board;
    	let t3;
    	let syn_1;
    	let t4;
    	let div2;
    	let folks;
    	let t5;
    	let div4;
    	let div3;
    	let i;
    	let i_class_value;
    	let t6;
    	let div7;
    	let div5;
    	let t7;
    	let div6;
    	let history;
    	let t8;
    	let debug_1;
    	let initResizeable_action;
    	let current;
    	let mounted;
    	let dispose;
    	board = new Board({ $$inline: true });
    	board.$on("requestChange", /*requestChange_handler*/ ctx[13]);
    	let syn_1_props = { applyDeltaFn: applyDelta, undoFn: undo };
    	syn_1 = new Syn$1({ props: syn_1_props, $$inline: true });
    	/*syn_1_binding*/ ctx[14](syn_1);
    	folks = new Folks({ $$inline: true });

    	history = new History({
    			props: { changeToTextFn: changeToText },
    			$$inline: true
    		});

    	debug_1 = new Debug({ $$inline: true });

    	const block = {
    		c: function create() {
    			script = element("script");
    			t0 = space();
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Talking Stickies";
    			t2 = space();
    			main = element("main");
    			div1 = element("div");
    			create_component(board.$$.fragment);
    			t3 = space();
    			create_component(syn_1.$$.fragment);
    			t4 = space();
    			div2 = element("div");
    			create_component(folks.$$.fragment);
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			i = element("i");
    			t6 = space();
    			div7 = element("div");
    			div5 = element("div");
    			t7 = space();
    			div6 = element("div");
    			create_component(history.$$.fragment);
    			t8 = space();
    			create_component(debug_1.$$.fragment);
    			if (script.src !== (script_src_value = "https://kit.fontawesome.com/80d72fa568.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file$8, 293, 2, 7259);
    			attr_dev(h1, "class", "svelte-14o08jt");
    			add_location(h1, file$8, 297, 2, 7389);
    			attr_dev(div0, "class", "toolbar svelte-14o08jt");
    			add_location(div0, file$8, 296, 0, 7365);
    			toggle_class(div1, "noscribe", /*noscribe*/ ctx[5]);
    			add_location(div1, file$8, 300, 2, 7431);
    			attr_dev(main, "class", "svelte-14o08jt");
    			add_location(main, file$8, 299, 0, 7422);
    			attr_dev(div2, "class", "folks-tray svelte-14o08jt");
    			add_location(div2, file$8, 306, 0, 7612);

    			attr_dev(i, "class", i_class_value = "tab-icon fas " + (/*drawerHidden*/ ctx[3]
    			? "fa-chevron-up"
    			: "fa-chevron-down") + " svelte-14o08jt");

    			toggle_class(i, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			add_location(i, file$8, 312, 4, 7888);
    			attr_dev(div3, "class", "tab-inner svelte-14o08jt");
    			toggle_class(div3, "shown", /*tabShown*/ ctx[4]);
    			add_location(div3, file$8, 311, 2, 7783);
    			attr_dev(div4, "class", "tab svelte-14o08jt");
    			toggle_class(div4, "shown", /*tabShown*/ ctx[4]);
    			toggle_class(div4, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			add_location(div4, file$8, 310, 0, 7657);
    			attr_dev(div5, "class", "handle svelte-14o08jt");
    			add_location(div5, file$8, 316, 2, 8168);
    			attr_dev(div6, "class", "debug-content svelte-14o08jt");
    			add_location(div6, file$8, 317, 2, 8251);
    			attr_dev(div7, "class", "debug-drawer svelte-14o08jt");
    			toggle_class(div7, "hidden", /*drawerHidden*/ ctx[3]);
    			add_location(div7, file$8, 315, 0, 8021);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			mount_component(board, div1, null);
    			append_dev(main, t3);
    			mount_component(syn_1, main, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(folks, div2, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, i);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div5);
    			/*div5_binding*/ ctx[15](div5);
    			append_dev(div7, t7);
    			append_dev(div7, div6);
    			mount_component(history, div6, null);
    			append_dev(div6, t8);
    			mount_component(debug_1, div6, null);
    			/*div7_binding*/ ctx[16](div7);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						div3,
    						"click",
    						function () {
    							if (is_function(/*drawerHidden*/ ctx[3]
    							? /*showDrawer*/ ctx[9]()
    							: /*hideDrawer*/ ctx[8]())) (/*drawerHidden*/ ctx[3]
    							? /*showDrawer*/ ctx[9]()
    							: /*hideDrawer*/ ctx[8]()).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(div4, "mouseenter", /*showTab*/ ctx[10], false, false, false),
    					listen_dev(div4, "mouseleave", /*hideTab*/ ctx[11], false, false, false),
    					listen_dev(div5, "mousedown", /*startDragging*/ ctx[7], false, false, false),
    					action_destroyer(initResizeable_action = /*initResizeable*/ ctx[6].call(null, div7)),
    					listen_dev(div7, "mouseenter", /*showTab*/ ctx[10], false, false, false),
    					listen_dev(div7, "mouseleave", /*hideTab*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*noscribe*/ 32) {
    				toggle_class(div1, "noscribe", /*noscribe*/ ctx[5]);
    			}

    			const syn_1_changes = {};
    			syn_1.$set(syn_1_changes);

    			if (!current || dirty & /*drawerHidden*/ 8 && i_class_value !== (i_class_value = "tab-icon fas " + (/*drawerHidden*/ ctx[3]
    			? "fa-chevron-up"
    			: "fa-chevron-down") + " svelte-14o08jt")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*drawerHidden, drawerHidden*/ 8) {
    				toggle_class(i, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			}

    			if (dirty & /*tabShown*/ 16) {
    				toggle_class(div3, "shown", /*tabShown*/ ctx[4]);
    			}

    			if (dirty & /*tabShown*/ 16) {
    				toggle_class(div4, "shown", /*tabShown*/ ctx[4]);
    			}

    			if (dirty & /*drawerHidden*/ 8) {
    				toggle_class(div4, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			}

    			if (dirty & /*drawerHidden*/ 8) {
    				toggle_class(div7, "hidden", /*drawerHidden*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(board.$$.fragment, local);
    			transition_in(syn_1.$$.fragment, local);
    			transition_in(folks.$$.fragment, local);
    			transition_in(history.$$.fragment, local);
    			transition_in(debug_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(board.$$.fragment, local);
    			transition_out(syn_1.$$.fragment, local);
    			transition_out(folks.$$.fragment, local);
    			transition_out(history.$$.fragment, local);
    			transition_out(debug_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			destroy_component(board);
    			/*syn_1_binding*/ ctx[14](null);
    			destroy_component(syn_1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    			destroy_component(folks);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div7);
    			/*div5_binding*/ ctx[15](null);
    			destroy_component(history);
    			destroy_component(debug_1);
    			/*div7_binding*/ ctx[16](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const minDrawerSize = 0;

    // definition of how to apply a delta to the content
    // if the delta is destructive also returns what was
    // destroyed for use by undo
    function applyDelta(content, delta) {
    	switch (delta.type) {
    		case "add-sticky":
    			{
    				const stickies = content.body.length === 0
    				? []
    				: JSON.parse(content.body);

    				content.body = JSON.stringify([...stickies, delta.value]);
    				return [content, { delta }];
    			}
    		case "update-sticky":
    			{
    				const stickies = content.body.length === 0
    				? []
    				: JSON.parse(content.body);

    				const updatedStickies = stickies.map(sticky => {
    					if (sticky.id === delta.value.id) {
    						return delta.value;
    					} else {
    						return sticky;
    					}
    				});

    				content.body = JSON.stringify(updatedStickies);

    				return [
    					content,
    					{
    						delta,
    						deleted: stickies.find(sticky => sticky.id === delta.value.id)
    					}
    				];
    			}
    		case "delete-sticky":
    			{
    				const stickies = content.body.length === 0
    				? []
    				: JSON.parse(content.body);

    				content.body = JSON.stringify(stickies.filter(sticky => sticky.id !== delta.value.id));

    				return [
    					content,
    					{
    						delta,
    						deleted: stickies.find(sticky => sticky.id === delta.value.id)
    					}
    				];
    			}
    	}
    }

    // definition of how to undo a change, returns a delta that will undo the change
    function undo(change) {
    	const delta = change.delta;

    	switch (delta.type) {
    		case "Title":
    			return { type: "Title", value: change.deleted };
    		case "Add":
    			const [loc, text] = delta.value;
    			return {
    				type: "Delete",
    				value: [loc, loc + text.length]
    			};
    		case "Delete":
    			const [start, end] = delta.value;
    			return {
    				type: "Add",
    				value: [start, change.deleted]
    			};
    		case "Meta":
    			return {
    				type: "Meta",
    				value: { setLoc: change.deleted }
    			};
    	}
    }

    // definition of how to convert a change to text for the history renderer
    function changeToText(change) {
    	let delta = change.delta;
    	let detail;

    	switch (delta.type) {
    		case "Add":
    			detail = `${delta.value[1]}@${delta.value[0]}`;
    			break;
    		case "Delete":
    			detail = `${change.deleted}@${delta.value[0]}`;
    			break;
    		case "Title":
    			detail = `${change.deleted}->${delta.value}`;
    			break;
    		case "Meta":
    			detail = "";
    	}

    	return `${delta.type}:\n${detail}`;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $scribeStr;
    	validate_store(scribeStr, "scribeStr");
    	component_subscribe($$self, scribeStr, $$value => $$invalidate(12, $scribeStr = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let syn;

    	// The debug drawer's ability to resized and hidden
    	let resizeable;

    	let resizeHandle;
    	const maxDrawerSize = document.documentElement.clientHeight - 30 - 10;

    	const initResizeable = resizeableEl => {
    		resizeableEl.style.setProperty("--max-height", `${maxDrawerSize}px`);
    		resizeableEl.style.setProperty("--min-height", `${minDrawerSize}px`);
    	};

    	const setDrawerHeight = height => {
    		document.documentElement.style.setProperty("--resizeable-height", `${height}px`);
    	};

    	const getDrawerHeight = () => {
    		const pxHeight = getComputedStyle(resizeable).getPropertyValue("--resizeable-height");
    		return parseInt(pxHeight, 10);
    	};

    	const startDragging = event => {
    		event.preventDefault();
    		const startingDrawerHeight = getDrawerHeight();
    		const yOffset = event.pageY;

    		const mouseDragHandler = moveEvent => {
    			moveEvent.preventDefault();
    			const primaryButtonPressed = moveEvent.buttons === 1;

    			if (!primaryButtonPressed) {
    				setDrawerHeight(Math.min(Math.max(getDrawerHeight(), minDrawerSize), maxDrawerSize));
    				window.removeEventListener("pointermove", mouseDragHandler);
    				return;
    			}

    			setDrawerHeight(Math.min(Math.max(yOffset - moveEvent.pageY + startingDrawerHeight, minDrawerSize), maxDrawerSize));
    		};

    		const remove = window.addEventListener("pointermove", mouseDragHandler);
    	};

    	let drawerHidden = true;

    	const hideDrawer = () => {
    		$$invalidate(3, drawerHidden = true);
    	};

    	const showDrawer = () => {
    		$$invalidate(3, drawerHidden = false);
    	};

    	let tabShown = false;

    	const showTab = () => {
    		$$invalidate(4, tabShown = true);
    	};

    	const hideTab = () => {
    		$$invalidate(4, tabShown = false);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const requestChange_handler = event => syn.requestChange(event.detail);

    	function syn_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			syn = $$value;
    			$$invalidate(0, syn);
    		});
    	}

    	function div5_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			resizeHandle = $$value;
    			$$invalidate(2, resizeHandle);
    		});
    	}

    	function div7_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			resizeable = $$value;
    			$$invalidate(1, resizeable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Board,
    		Folks,
    		Syn: Syn$1,
    		Debug,
    		History,
    		scribeStr,
    		applyDelta,
    		undo,
    		changeToText,
    		syn,
    		resizeable,
    		resizeHandle,
    		minDrawerSize,
    		maxDrawerSize,
    		initResizeable,
    		setDrawerHeight,
    		getDrawerHeight,
    		startDragging,
    		drawerHidden,
    		hideDrawer,
    		showDrawer,
    		tabShown,
    		showTab,
    		hideTab,
    		noscribe,
    		$scribeStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("syn" in $$props) $$invalidate(0, syn = $$props.syn);
    		if ("resizeable" in $$props) $$invalidate(1, resizeable = $$props.resizeable);
    		if ("resizeHandle" in $$props) $$invalidate(2, resizeHandle = $$props.resizeHandle);
    		if ("drawerHidden" in $$props) $$invalidate(3, drawerHidden = $$props.drawerHidden);
    		if ("tabShown" in $$props) $$invalidate(4, tabShown = $$props.tabShown);
    		if ("noscribe" in $$props) $$invalidate(5, noscribe = $$props.noscribe);
    	};

    	let noscribe;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$scribeStr*/ 4096) {
    			 $$invalidate(5, noscribe = $scribeStr === "");
    		}
    	};

    	return [
    		syn,
    		resizeable,
    		resizeHandle,
    		drawerHidden,
    		tabShown,
    		noscribe,
    		initResizeable,
    		startDragging,
    		hideDrawer,
    		showDrawer,
    		showTab,
    		hideTab,
    		$scribeStr,
    		requestChange_handler,
    		syn_1_binding,
    		div5_binding,
    		div7_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app$2 = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app$2;

}());
//# sourceMappingURL=bundle.js.map
