
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
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
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
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
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
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
    function tick() {
        schedule_update();
        return resolved_promise;
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
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
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
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

    const session = writable();

    const content = writable({ title: '', body: '' });

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

    // retruns binary input as hex number string (e.g. 'a293b8e1a')

    function CSSifyHSL(hslArray) {
      const [h,s,l] = hslArray;
      return `hsl(${h} ${s}% ${l}%)`
    }

    /* src/Editor.svelte generated by Svelte v3.42.4 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$7 = "src/Editor.svelte";

    function create_fragment$7(ctx) {
    	let editor_1;
    	let span0;
    	let t0;
    	let span1;
    	let span2;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			editor_1 = element("editor");
    			span0 = element("span");
    			t0 = text(/*editor_content1*/ ctx[2]);
    			span1 = element("span");
    			span2 = element("span");
    			t1 = text(/*editor_content2*/ ctx[3]);
    			add_location(span0, file$7, 109, 2, 3072);
    			attr_dev(span1, "class", "cursor svelte-qp3u3");
    			add_location(span1, file$7, 109, 32, 3102);
    			add_location(span2, file$7, 109, 79, 3149);
    			attr_dev(editor_1, "tabindex", "0");
    			attr_dev(editor_1, "start", "0");
    			attr_dev(editor_1, "class", "svelte-qp3u3");
    			add_location(editor_1, file$7, 108, 0, 2975);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, editor_1, anchor);
    			append_dev(editor_1, span0);
    			append_dev(span0, t0);
    			append_dev(editor_1, span1);
    			/*span1_binding*/ ctx[10](span1);
    			append_dev(editor_1, span2);
    			append_dev(span2, t1);
    			/*editor_1_binding*/ ctx[11](editor_1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(editor_1, "click", /*handleClick*/ ctx[5], false, false, false),
    					listen_dev(editor_1, "keydown", /*handleInput*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*editor_content1*/ 4) set_data_dev(t0, /*editor_content1*/ ctx[2]);
    			if (dirty & /*editor_content2*/ 8) set_data_dev(t1, /*editor_content2*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(editor_1);
    			/*span1_binding*/ ctx[10](null);
    			/*editor_1_binding*/ ctx[11](null);
    			mounted = false;
    			run_all(dispose);
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
    	let myTag;
    	let editor_content1;
    	let editor_content2;
    	let $connection;
    	let $content;
    	let $session;
    	validate_store(connection, 'connection');
    	component_subscribe($$self, connection, $$value => $$invalidate(7, $connection = $$value));
    	validate_store(content, 'content');
    	component_subscribe($$self, content, $$value => $$invalidate(8, $content = $$value));
    	validate_store(session, 'session');
    	component_subscribe($$self, session, $$value => $$invalidate(9, $session = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Editor', slots, []);
    	const dispatch = createEventDispatcher();

    	function getLoc(tag) {
    		return $content.meta
    		? $content.meta[tag] ? $content.meta[tag] : 0
    		: 0;
    	}

    	let editor;

    	function addText(text) {
    		const loc = getLoc(myTag);
    		const deltas = [{ type: 'Add', value: [loc, text] }];

    		for (const [tag, tagLoc] of Object.entries($content.meta)) {
    			if (tagLoc >= loc) {
    				deltas.push({
    					type: 'Meta',
    					value: { setLoc: [tag, tagLoc + text.length] }
    				});
    			}
    		}

    		dispatch('requestChange', deltas);
    	}

    	function handleInput(event) {
    		const loc = getLoc(myTag);
    		const key = event.key;

    		if (key.length == 1) {
    			addText(key);
    		} else {
    			switch (key) {
    				case 'ArrowRight':
    					if (loc < $content.body.length) {
    						dispatch('requestChange', [
    							{
    								type: 'Meta',
    								value: { setLoc: [myTag, loc + 1] }
    							}
    						]);
    					}
    					break;
    				case 'ArrowLeft':
    					if (loc > 0) {
    						dispatch('requestChange', [
    							{
    								type: 'Meta',
    								value: { setLoc: [myTag, loc - 1] }
    							}
    						]);
    					}
    					break;
    				case 'Enter':
    					addText('\n');
    					break;
    				case 'Backspace':
    					if (loc > 0) {
    						const deltas = [{ type: 'Delete', value: [loc - 1, loc] }];

    						for (const [tag, tagLoc] of Object.entries($content.meta)) {
    							if (tagLoc >= loc) {
    								deltas.push({
    									type: 'Meta',
    									value: { setLoc: [tag, tagLoc - 1] }
    								});
    							}
    						}

    						dispatch('requestChange', deltas);
    					}
    			}
    		}

    		console.log('input', event.key);
    	}

    	function handleClick(e) {
    		const offset = window.getSelection().focusOffset;
    		let loc = offset > 0 ? offset : 0;

    		if (window.getSelection().focusNode.parentElement == editor.lastChild) {
    			loc += editor_content1.length;
    		}

    		if (loc != getLoc(myTag)) {
    			dispatch('requestChange', [
    				{
    					type: 'Meta',
    					value: { setLoc: [myTag, loc] }
    				}
    			]);
    		}
    	}

    	let cursor;
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	function span1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			cursor = $$value;
    			($$invalidate(0, cursor), $$invalidate(7, $connection));
    		});
    	}

    	function editor_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			editor = $$value;
    			$$invalidate(1, editor);
    		});
    	}

    	$$self.$capture_state = () => ({
    		content,
    		connection,
    		session,
    		createEventDispatcher,
    		CSSifyHSL,
    		dispatch,
    		getLoc,
    		editor,
    		addText,
    		handleInput,
    		handleClick,
    		cursor,
    		myTag,
    		editor_content1,
    		editor_content2,
    		$connection,
    		$content,
    		$session
    	});

    	$$self.$inject_state = $$props => {
    		if ('editor' in $$props) $$invalidate(1, editor = $$props.editor);
    		if ('cursor' in $$props) $$invalidate(0, cursor = $$props.cursor);
    		if ('myTag' in $$props) $$invalidate(6, myTag = $$props.myTag);
    		if ('editor_content1' in $$props) $$invalidate(2, editor_content1 = $$props.editor_content1);
    		if ('editor_content2' in $$props) $$invalidate(3, editor_content2 = $$props.editor_content2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$session*/ 512) {
    			$$invalidate(6, myTag = $session ? $session.myTag : '');
    		}

    		if ($$self.$$.dirty & /*$content, myTag*/ 320) {
    			$$invalidate(2, editor_content1 = $content.body.slice(0, getLoc(myTag)));
    		}

    		if ($$self.$$.dirty & /*$content, myTag*/ 320) {
    			$$invalidate(3, editor_content2 = $content.body.slice(getLoc(myTag)));
    		}

    		if ($$self.$$.dirty & /*cursor, $connection*/ 129) {
    			{
    				// wait for cursor and connection and color inside connection to exist
    				// before updating the cursor color
    				if (cursor && $connection && $connection.syn && $connection.syn.myColors) {
    					$$invalidate(0, cursor.style['border-color'] = CSSifyHSL($connection.syn.myColors.primary), cursor);
    				}
    			}
    		}
    	};

    	return [
    		cursor,
    		editor,
    		editor_content1,
    		editor_content2,
    		handleInput,
    		handleClick,
    		myTag,
    		$connection,
    		$content,
    		$session,
    		span1_binding,
    		editor_1_binding
    	];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Title.svelte generated by Svelte v3.42.4 */

    const { console: console_1 } = globals;
    const file$6 = "src/Title.svelte";

    // (93:2) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let span;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*untitled*/ ctx[4]) return create_if_block_1$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			if_block.c();
    			attr_dev(span, "class", "svelte-1turqhe");
    			toggle_class(span, "untitled", /*untitled*/ ctx[4]);
    			add_location(span, file$6, 94, 6, 2415);
    			attr_dev(div, "class", "title svelte-1turqhe");
    			toggle_class(div, "title-hover", /*titleHover*/ ctx[5]);
    			add_location(div, file$6, 93, 4, 2255);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			if_block.m(span, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[11], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[12], false, false, false),
    					listen_dev(div, "click", /*beginEditTitle*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, null);
    				}
    			}

    			if (dirty & /*untitled*/ 16) {
    				toggle_class(span, "untitled", /*untitled*/ ctx[4]);
    			}

    			if (dirty & /*titleHover*/ 32) {
    				toggle_class(div, "title-hover", /*titleHover*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(93:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (91:2) {#if editingTitle}
    function create_if_block$3(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "title-input svelte-1turqhe");
    			add_location(input, file$6, 91, 4, 2110);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*titleBeingTyped*/ ctx[1]);
    			/*input_binding*/ ctx[10](input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(input, "keydown", /*handleTitleKeypress*/ ctx[8], false, false, false),
    					listen_dev(input, "blur", /*saveTitle*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*titleBeingTyped*/ 2 && input.value !== /*titleBeingTyped*/ ctx[1]) {
    				set_input_value(input, /*titleBeingTyped*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[10](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(91:2) {#if editingTitle}",
    		ctx
    	});

    	return block;
    }

    // (98:8) {:else}
    function create_else_block_1(ctx) {
    	let t_value = /*$content*/ ctx[0].title + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$content*/ 1 && t_value !== (t_value = /*$content*/ ctx[0].title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(98:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (96:8) {#if untitled}
    function create_if_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Untitled Document");
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(96:8) {#if untitled}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*editingTitle*/ ctx[2]) return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("Title:\n  ");
    			if_block.c();
    			attr_dev(div, "class", "title-wrapper svelte-1turqhe");
    			add_location(div, file$6, 88, 0, 2048);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $content;
    	validate_store(content, 'content');
    	component_subscribe($$self, content, $$value => $$invalidate(0, $content = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Title', slots, []);
    	const dispatch = createEventDispatcher();
    	let titleBeingTyped = '';
    	let editingTitle = false;

    	function saveTitle() {
    		if (editingTitle) {
    			// only dispatch a changeReq if the title trying to be saved is different
    			// than the current title
    			if (titleBeingTyped !== $content.title) {
    				let delta = { type: 'Title', value: titleBeingTyped };
    				dispatch('requestChange', [delta]);
    			}

    			$$invalidate(1, titleBeingTyped = '');
    			$$invalidate(2, editingTitle = false);
    		} else {
    			console.log("Can't run saveTitle when it wasn't being edited!");
    		}
    	}

    	let titleEl; // variable to bind the title input to when it's created

    	async function beginEditTitle() {
    		$$invalidate(5, titleHover = false);
    		$$invalidate(1, titleBeingTyped = $content.title); // fill the field with the current title
    		$$invalidate(2, editingTitle = true);
    		await tick(); // wait for the title input element to be created
    		titleEl.focus();
    	}

    	function handleTitleKeypress() {
    		if (event.key == 'Enter') {
    			saveTitle();
    		} else if (event.key == 'Escape') {
    			// don't save new title & discard changes
    			$$invalidate(1, titleBeingTyped = '');

    			// turn off editing
    			$$invalidate(2, editingTitle = false);
    		}
    	}

    	// keep track of whether the doc is untitled
    	let untitled;

    	let titleHover; // whether the title is being hovered
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		titleBeingTyped = this.value;
    		$$invalidate(1, titleBeingTyped);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			titleEl = $$value;
    			$$invalidate(3, titleEl);
    		});
    	}

    	const mouseenter_handler = () => {
    		$$invalidate(5, titleHover = true);
    	};

    	const mouseleave_handler = () => {
    		$$invalidate(5, titleHover = false);
    	};

    	$$self.$capture_state = () => ({
    		content,
    		createEventDispatcher,
    		tick,
    		dispatch,
    		titleBeingTyped,
    		editingTitle,
    		saveTitle,
    		titleEl,
    		beginEditTitle,
    		handleTitleKeypress,
    		untitled,
    		titleHover,
    		$content
    	});

    	$$self.$inject_state = $$props => {
    		if ('titleBeingTyped' in $$props) $$invalidate(1, titleBeingTyped = $$props.titleBeingTyped);
    		if ('editingTitle' in $$props) $$invalidate(2, editingTitle = $$props.editingTitle);
    		if ('titleEl' in $$props) $$invalidate(3, titleEl = $$props.titleEl);
    		if ('untitled' in $$props) $$invalidate(4, untitled = $$props.untitled);
    		if ('titleHover' in $$props) $$invalidate(5, titleHover = $$props.titleHover);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$content*/ 1) {
    			$$invalidate(4, untitled = $content.title === '');
    		}
    	};

    	return [
    		$content,
    		titleBeingTyped,
    		editingTitle,
    		titleEl,
    		untitled,
    		titleHover,
    		saveTitle,
    		beginEditTitle,
    		handleTitleKeypress,
    		input_input_handler,
    		input_binding,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Folk.svelte generated by Svelte v3.42.4 */
    const file$5 = "src/Folk.svelte";

    // (82:0) {#if $connection && $connection.syn}
    function create_if_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*scribe*/ ctx[3]) return create_if_block_1;
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
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			t1 = text(t1_value);
    			attr_dev(div0, "class", "folk-color svelte-e1mrh0");
    			add_location(div0, file$5, 92, 6, 3061);
    			attr_dev(div1, "class", "folk svelte-e1mrh0");
    			toggle_class(div1, "me", /*me*/ ctx[1]);
    			toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[2]);
    			add_location(div1, file$5, 91, 4, 2978);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = action_destroyer(/*setUpHex*/ ctx[5].call(null, div1));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pubKeyStr*/ 1 && t1_value !== (t1_value = /*pubKeyStr*/ ctx[0].slice(-4) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*me*/ 2) {
    				toggle_class(div1, "me", /*me*/ ctx[1]);
    			}

    			if (dirty & /*outOfSession*/ 4) {
    				toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[2]);
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
    function create_if_block_1(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = /*pubKeyStr*/ ctx[0].slice(-4) + "";
    	let t1;
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
    			add_location(div0, file$5, 85, 8, 2841);
    			attr_dev(div1, "class", "folk scribe svelte-e1mrh0");
    			toggle_class(div1, "me", /*me*/ ctx[1]);
    			toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[2]);
    			add_location(div1, file$5, 84, 6, 2749);
    			attr_dev(div2, "class", "scribe-halo svelte-e1mrh0");
    			add_location(div2, file$5, 88, 6, 2921);
    			attr_dev(div3, "class", "scribe-wrapper svelte-e1mrh0");
    			add_location(div3, file$5, 83, 4, 2714);
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
    				dispose = action_destroyer(/*setUpHex*/ ctx[5].call(null, div1));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pubKeyStr*/ 1 && t1_value !== (t1_value = /*pubKeyStr*/ ctx[0].slice(-4) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*me*/ 2) {
    				toggle_class(div1, "me", /*me*/ ctx[1]);
    			}

    			if (dirty & /*outOfSession*/ 4) {
    				toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[2]);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(83:2) {#if scribe}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let scribe;
    	let outOfSession;
    	let $folks;
    	let $connection;
    	let $scribeStr;
    	validate_store(folks, 'folks');
    	component_subscribe($$self, folks, $$value => $$invalidate(7, $folks = $$value));
    	validate_store(connection, 'connection');
    	component_subscribe($$self, connection, $$value => $$invalidate(4, $connection = $$value));
    	validate_store(scribeStr, 'scribeStr');
    	component_subscribe($$self, scribeStr, $$value => $$invalidate(8, $scribeStr = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Folk', slots, []);
    	let { pubKeyStr = '' } = $$props;
    	let { pubKey } = $$props;
    	let { me = false } = $$props;

    	function setUpHex(hexEl) {
    		let colors;

    		if (me) {
    			colors = $connection.syn.myColors;
    		} else {
    			colors = $folks[pubKeyStr].colors;
    		}

    		hexEl.style['background-color'] = CSSifyHSL(colors.primary);

    		// hex element's first child is its picture/hexagonColor div
    		hexEl.firstChild.style['background-color'] = CSSifyHSL(colors.hexagon);
    	}

    	const writable_props = ['pubKeyStr', 'pubKey', 'me'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Folk> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('pubKeyStr' in $$props) $$invalidate(0, pubKeyStr = $$props.pubKeyStr);
    		if ('pubKey' in $$props) $$invalidate(6, pubKey = $$props.pubKey);
    		if ('me' in $$props) $$invalidate(1, me = $$props.me);
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
    		outOfSession,
    		scribe,
    		$folks,
    		$connection,
    		$scribeStr
    	});

    	$$self.$inject_state = $$props => {
    		if ('pubKeyStr' in $$props) $$invalidate(0, pubKeyStr = $$props.pubKeyStr);
    		if ('pubKey' in $$props) $$invalidate(6, pubKey = $$props.pubKey);
    		if ('me' in $$props) $$invalidate(1, me = $$props.me);
    		if ('outOfSession' in $$props) $$invalidate(2, outOfSession = $$props.outOfSession);
    		if ('scribe' in $$props) $$invalidate(3, scribe = $$props.scribe);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pubKeyStr, $scribeStr*/ 257) {
    			$$invalidate(3, scribe = pubKeyStr == $scribeStr);
    		}

    		if ($$self.$$.dirty & /*$folks, pubKeyStr, me*/ 131) {
    			$$invalidate(2, outOfSession = (!$folks[pubKeyStr] || !$folks[pubKeyStr].inSession) && !me);
    		}
    	};

    	return [
    		pubKeyStr,
    		me,
    		outOfSession,
    		scribe,
    		$connection,
    		setUpHex,
    		pubKey,
    		$folks,
    		$scribeStr
    	];
    }

    class Folk extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { pubKeyStr: 0, pubKey: 6, me: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Folk",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pubKey*/ ctx[6] === undefined && !('pubKey' in props)) {
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

    /* src/Folks.svelte generated by Svelte v3.42.4 */

    const { Object: Object_1 } = globals;
    const file$4 = "src/Folks.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (18:2) {#if $connection && $connection.syn && $connection.syn.me}
    function create_if_block$1(ctx) {
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
    		id: create_if_block$1.name,
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

    function create_fragment$4(ctx) {
    	let div;
    	let t;
    	let current;
    	let if_block = /*$connection*/ ctx[0] && /*$connection*/ ctx[0].syn && /*$connection*/ ctx[0].syn.me && create_if_block$1(ctx);
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
    			add_location(div, file$4, 16, 0, 386);
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
    					if_block = create_if_block$1(ctx);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $connection;
    	let $folks;
    	validate_store(connection, 'connection');
    	component_subscribe($$self, connection, $$value => $$invalidate(0, $connection = $$value));
    	validate_store(folks, 'folks');
    	component_subscribe($$self, folks, $$value => $$invalidate(1, $folks = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Folks', slots, []);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Folks> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Folks",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Debug.svelte generated by Svelte v3.42.4 */
    const file$3 = "src/Debug.svelte";

    // (14:6) {:else}
    function create_else_block(ctx) {
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(14:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:6) {#if $connection && $connection.syn}
    function create_if_block(ctx) {
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:6) {#if $connection && $connection.syn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let ul;
    	let li0;
    	let t0;
    	let li1;
    	let t1;

    	let t2_value = (/*$session*/ ctx[1]
    	? /*$session*/ ctx[1].contentHashStr
    	: '') + "";

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
    		if (/*$connection*/ ctx[0] && /*$connection*/ ctx[0].syn) return create_if_block;
    		return create_else_block;
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
    			add_location(li0, file$3, 10, 4, 157);
    			add_location(li1, file$3, 16, 4, 305);
    			add_location(li2, file$3, 17, 4, 380);
    			add_location(li3, file$3, 18, 4, 424);
    			add_location(li4, file$3, 19, 4, 456);
    			attr_dev(ul, "class", "svelte-tgi576");
    			add_location(ul, file$3, 9, 2, 148);
    			add_location(div, file$3, 8, 0, 140);
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
    			: '') + "")) set_data_dev(t2, t2_value);

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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $connection;
    	let $session;
    	let $nextIndex;
    	let $scribeStr;
    	validate_store(connection, 'connection');
    	component_subscribe($$self, connection, $$value => $$invalidate(0, $connection = $$value));
    	validate_store(session, 'session');
    	component_subscribe($$self, session, $$value => $$invalidate(1, $session = $$value));
    	validate_store(nextIndex, 'nextIndex');
    	component_subscribe($$self, nextIndex, $$value => $$invalidate(2, $nextIndex = $$value));
    	validate_store(scribeStr, 'scribeStr');
    	component_subscribe($$self, scribeStr, $$value => $$invalidate(3, $scribeStr = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Debug', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Debug> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Debug",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/HistoryEntry.svelte generated by Svelte v3.42.4 */

    const file$2 = "src/HistoryEntry.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let t;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(div, "class", div_class_value = "history-entry " + /*status*/ ctx[1] + " svelte-1led4hq");
    			add_location(div, file$2, 27, 0, 474);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HistoryEntry', slots, []);
    	let { text } = $$props;
    	let { status } = $$props;
    	const writable_props = ['text', 'status'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HistoryEntry> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('status' in $$props) $$invalidate(1, status = $$props.status);
    	};

    	$$self.$capture_state = () => ({ text, status });

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('status' in $$props) $$invalidate(1, status = $$props.status);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, status];
    }

    class HistoryEntry extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { text: 0, status: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HistoryEntry",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !('text' in props)) {
    			console.warn("<HistoryEntry> was created without expected prop 'text'");
    		}

    		if (/*status*/ ctx[1] === undefined && !('status' in props)) {
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

    /* src/History.svelte generated by Svelte v3.42.4 */
    const file$1 = "src/History.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (58:4) {#each historyEntries as historyEntry}
    function create_each_block(ctx) {
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(58:4) {#each historyEntries as historyEntry}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let current;
    	let each_value = /*historyEntries*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    			add_location(div0, file$1, 56, 2, 1591);
    			attr_dev(div1, "class", "history svelte-ywa4w4");
    			add_location(div1, file$1, 54, 0, 1556);
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
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $committedChanges;
    	let $recordedChanges;
    	let $requestedChanges;
    	validate_store(committedChanges, 'committedChanges');
    	component_subscribe($$self, committedChanges, $$value => $$invalidate(5, $committedChanges = $$value));
    	validate_store(recordedChanges, 'recordedChanges');
    	component_subscribe($$self, recordedChanges, $$value => $$invalidate(6, $recordedChanges = $$value));
    	validate_store(requestedChanges, 'requestedChanges');
    	component_subscribe($$self, requestedChanges, $$value => $$invalidate(7, $requestedChanges = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('History', slots, []);
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
    		let entryElem = document.getElementsByClassName('history-entries')[0];

    		if (entryElem.firstChild !== null) {
    			entryElem.firstChild.scrollIntoView(false);
    		}
    	});

    	const writable_props = ['changeToTextFn'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<History> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('changeToTextFn' in $$props) $$invalidate(1, changeToTextFn = $$props.changeToTextFn);
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
    		$committedChanges,
    		$recordedChanges,
    		$requestedChanges
    	});

    	$$self.$inject_state = $$props => {
    		if ('changeToTextFn' in $$props) $$invalidate(1, changeToTextFn = $$props.changeToTextFn);
    		if ('requestedH' in $$props) $$invalidate(2, requestedH = $$props.requestedH);
    		if ('recordedH' in $$props) $$invalidate(3, recordedH = $$props.recordedH);
    		if ('committedH' in $$props) $$invalidate(4, committedH = $$props.committedH);
    		if ('historyEntries' in $$props) $$invalidate(0, historyEntries = $$props.historyEntries);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$requestedChanges*/ 128) {
    			{
    				$$invalidate(2, requestedH = changesToEntriesList($requestedChanges, 'requested'));
    			}
    		}

    		if ($$self.$$.dirty & /*$recordedChanges*/ 64) {
    			{
    				$$invalidate(3, recordedH = changesToEntriesList($recordedChanges, 'recorded'));
    			}
    		}

    		if ($$self.$$.dirty & /*$committedChanges*/ 32) {
    			{
    				$$invalidate(4, committedH = changesToEntriesList($committedChanges, 'committed'));
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
    		$committedChanges,
    		$recordedChanges,
    		$requestedChanges
    	];
    }

    class History extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { changeToTextFn: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "History",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*changeToTextFn*/ ctx[1] === undefined && !('changeToTextFn' in props)) {
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

    (function(){
    function g(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}}
    if(!ShadowRoot.prototype.createElement){var h=window.HTMLElement,l=window.customElements.define,m=window.customElements.get,n=window.customElements,p=new WeakMap,q=new WeakMap,r=new WeakMap,t=new WeakMap;window.CustomElementRegistry=function(){this.l=new Map;this.o=new Map;this.i=new Map;this.h=new Map;};window.CustomElementRegistry.prototype.define=function(a,b){a=a.toLowerCase();if(void 0!==this.j(a))throw new DOMException("Failed to execute 'define' on 'CustomElementRegistry': the name \""+a+'" has already been used with this registry');
    if(void 0!==this.o.get(b))throw new DOMException("Failed to execute 'define' on 'CustomElementRegistry': this constructor has already been used with this registry");var c=b.prototype.attributeChangedCallback,d=new Set(b.observedAttributes||[]);u(b,d,c);c={g:b,connectedCallback:b.prototype.connectedCallback,disconnectedCallback:b.prototype.disconnectedCallback,adoptedCallback:b.prototype.adoptedCallback,attributeChangedCallback:c,observedAttributes:d};this.l.set(a,c);this.o.set(b,c);d=m.call(n,a);
    d||(d=v(a),l.call(n,a,d));this===window.customElements&&(r.set(b,c),c.s=d);if(d=this.h.get(a)){this.h.delete(a);var e="undefined"!=typeof Symbol&&Symbol.iterator&&d[Symbol.iterator];d=e?e.call(d):{next:g(d)};for(e=d.next();!e.done;e=d.next())e=e.value,q.delete(e),w(e,c,!0);}c=this.i.get(a);void 0!==c&&(c.resolve(b),this.i.delete(a));return b};window.CustomElementRegistry.prototype.upgrade=function(){x.push(this);n.upgrade.apply(n,arguments);x.pop();};window.CustomElementRegistry.prototype.get=function(a){var b;
    return null==(b=this.l.get(a))?void 0:b.g};window.CustomElementRegistry.prototype.j=function(a){return this.l.get(a)};window.CustomElementRegistry.prototype.whenDefined=function(a){var b=this.j(a);if(void 0!==b)return Promise.resolve(b.g);var c=this.i.get(a);void 0===c&&(c={},c.promise=new Promise(function(d){return c.resolve=d}),this.i.set(a,c));return c.promise};window.CustomElementRegistry.prototype.m=function(a,b,c){var d=this.h.get(b);d||this.h.set(b,d=new Set);c?d.add(a):d.delete(a);};var y;
    window.HTMLElement=function(){var a=y;if(a)return y=void 0,a;var b=r.get(this.constructor);if(!b)throw new TypeError("Illegal constructor (custom element class must be registered with global customElements registry to be newable)");a=Reflect.construct(h,[],b.s);Object.setPrototypeOf(a,this.constructor.prototype);p.set(a,b);return a};window.HTMLElement.prototype=h.prototype;var v=function(a){function b(){var c=Reflect.construct(h,[],this.constructor);Object.setPrototypeOf(c,HTMLElement.prototype);
    a:{var d=c.getRootNode();if(!(d===document||d instanceof ShadowRoot)){d=x[x.length-1];if(d instanceof CustomElementRegistry){var e=d;break a}d=d.getRootNode();d===document||d instanceof ShadowRoot||(d=(null==(e=t.get(d))?void 0:e.getRootNode())||document);}e=d.customElements;}e=e||window.customElements;(d=e.j(a))?w(c,d):q.set(c,e);return c}b.prototype.connectedCallback=function(){var c=p.get(this);c?c.connectedCallback&&c.connectedCallback.apply(this,arguments):q.get(this).m(this,a,!0);};b.prototype.disconnectedCallback=
    function(){var c=p.get(this);c?c.disconnectedCallback&&c.disconnectedCallback.apply(this,arguments):q.get(this).m(this,a,!1);};b.prototype.adoptedCallback=function(){var c,d;null==(c=p.get(this))||null==(d=c.adoptedCallback)||d.apply(this,arguments);};return b},u=function(a,b,c){if(0!==b.size&&void 0!==c){var d=a.prototype.setAttribute;d&&(a.prototype.setAttribute=function(f,k){if(b.has(f)){var C=this.getAttribute(f);d.call(this,f,k);c.call(this,f,C,k);}else d.call(this,f,k);});var e=a.prototype.removeAttribute;
    e&&(a.prototype.removeAttribute=function(f){if(b.has(f)){var k=this.getAttribute(f);e.call(this,f);c.call(this,f,k,null);}else e.call(this,f);});}},z=function(a){var b=Object.getPrototypeOf(a);if(b!==window.HTMLElement)return b===h?Object.setPrototypeOf(a,window.HTMLElement):z(b)},w=function(a,b,c){c=void 0===c?!1:c;Object.setPrototypeOf(a,b.g.prototype);p.set(a,b);y=a;try{new b.g;}catch(d){z(b.g),new b.g;}b.observedAttributes.forEach(function(d){a.hasAttribute(d)&&b.attributeChangedCallback.call(a,d,
    null,a.getAttribute(d));});c&&b.connectedCallback&&a.isConnected&&b.connectedCallback.call(a);},A=Element.prototype.attachShadow;Element.prototype.attachShadow=function(a){var b=A.apply(this,arguments);a.customElements&&(b.customElements=a.customElements);return b};var x=[document],B=function(a,b,c){var d=(c?Object.getPrototypeOf(c):a.prototype)[b];a.prototype[b]=function(){x.push(this);var e=d.apply(c||this,arguments);void 0!==e&&t.set(e,this);x.pop();return e};};B(ShadowRoot,"createElement",document);
    B(ShadowRoot,"importNode",document);B(Element,"insertAdjacentHTML");var D=function(a){var b=Object.getOwnPropertyDescriptor(a.prototype,"innerHTML");Object.defineProperty(a.prototype,"innerHTML",Object.assign({},b,{set:function(c){x.push(this);b.set.call(this,c);x.pop();}}));};D(Element);D(ShadowRoot);Object.defineProperty(window,"customElements",{value:new CustomElementRegistry,configurable:!0,writable:!0});}}).call(self);

    const appliedClassMixins = new WeakMap();

    /** Vefify if the Mixin was previously applyed
     * @private
     * @param {function} mixin      Mixin being applyed
     * @param {object} superClass   Class receiving the new mixin
     * @returns {boolean}
     */
    function wasMixinPreviouslyApplied(mixin, superClass) {
      let klass = superClass;
      while (klass) {
        if (appliedClassMixins.get(klass) === mixin) {
          return true;
        }
        klass = Object.getPrototypeOf(klass);
      }
      return false;
    }

    /** Apply each mixin in the chain to make sure they are not applied more than once to the final class.
     * @export
     * @param {function} mixin      Mixin to be applyed
     * @returns {object}            Mixed class with mixin applied
     */
    function dedupeMixin(mixin) {
      return superClass => {
        if (wasMixinPreviouslyApplied(mixin, superClass)) {
          return superClass;
        }
        const mixedClass = mixin(superClass);
        appliedClassMixins.set(mixedClass, mixin);
        return mixedClass;
      };
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const t$4=window.ShadowRoot&&(void 0===window.ShadyCSS||window.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,e$4=Symbol(),s$5=new Map;class n$5{constructor(t,s){if(this._$cssResult$=!0,s!==e$4)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t;}get styleSheet(){let e=s$5.get(this.cssText);return t$4&&void 0===e&&(s$5.set(this.cssText,e=new CSSStyleSheet),e.replaceSync(this.cssText)),e}toString(){return this.cssText}}const o$5=t=>new n$5("string"==typeof t?t:t+"",e$4),r$3=(t,...s)=>{const o=1===t.length?t[0]:s.reduce(((e,s,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[n+1]),t[0]);return new n$5(o,e$4)},S$1=(e,s)=>{t$4?e.adoptedStyleSheets=s.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet)):s.forEach((t=>{const s=document.createElement("style");s.textContent=t.cssText,e.appendChild(s);}));},i$4=t$4?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return o$5(e)})(t):t;

    /**
     * @typedef {import('./types').RenderOptions} RenderOptions
     * @typedef {import('./types').ScopedElementsMixin} ScopedElementsMixin
     * @typedef {import('./types').ScopedElementsHost} ScopedElementsHost
     * @typedef {import('./types').ScopedElementsMap} ScopedElementsMap
     * @typedef {import('@lit/reactive-element').CSSResultFlatArray} CSSResultFlatArray
     */

    /**
     * @template {import('./types').Constructor<HTMLElement>} T
     * @param {T} superclass
     * @return {T & import('./types').Constructor<ScopedElementsHost>}
     */
    const ScopedElementsMixinImplementation = superclass =>
      /** @type {ScopedElementsHost} */
      class ScopedElementsHost extends superclass {
        /**
         * Obtains the scoped elements definitions map if specified.
         *
         * @returns {ScopedElementsMap}
         */
        static get scopedElements() {
          return {};
        }

        /**
         * Obtains the ShadowRoot options.
         *
         * @type {ShadowRootInit}
         */
        static get shadowRootOptions() {
          return this.__shadowRootOptions;
        }

        /**
         * Set the shadowRoot options.
         *
         * @param {ShadowRootInit} value
         */
        static set shadowRootOptions(value) {
          this.__shadowRootOptions = value;
        }

        /**
         * Obtains the element styles.
         *
         * @returns {CSSResultFlatArray}
         */
        static get elementStyles() {
          return this.__elementStyles;
        }

        static set elementStyles(styles) {
          this.__elementStyles = styles;
        }

        // either TS or ESLint will complain here
        // eslint-disable-next-line no-unused-vars
        constructor(..._args) {
          super();
          /** @type {RenderOptions} */
          this.renderOptions = this.renderOptions || undefined;
        }

        /**
         * Obtains the CustomElementRegistry associated to the ShadowRoot.
         *
         * @returns {CustomElementRegistry}
         */
        get registry() {
          // @ts-ignore
          return this.constructor.__registry;
        }

        /**
         * Set the CustomElementRegistry associated to the ShadowRoot
         *
         * @param {CustomElementRegistry} registry
         */
        set registry(registry) {
          // @ts-ignore
          this.constructor.__registry = registry;
        }

        /** @override */
        createRenderRoot() {
          const {
            scopedElements,
            shadowRootOptions,
            elementStyles,
          } = /** @type {typeof ScopedElementsHost} */ (this.constructor);

          if (!this.registry) {
            this.registry = new CustomElementRegistry();

            Object.entries(scopedElements).forEach(([tagName, klass]) =>
              this.registry.define(tagName, klass),
            );
          }

          /** @type {ShadowRootInit} */
          const options = {
            mode: 'open',
            ...shadowRootOptions,
            customElements: this.registry,
          };

          this.renderOptions.creationScope = this.attachShadow(options);

          if (this.renderOptions.creationScope instanceof ShadowRoot)
            S$1(this.renderOptions.creationScope, elementStyles);

          return this.renderOptions.creationScope;
        }

        /**
         * Defines a scoped element.
         *
         * @param {string} tagName
         * @param {typeof HTMLElement} klass
         */
        defineScopedElement(tagName, klass) {
          return this.registry.get(tagName) || this.registry.define(tagName, klass);
        }

        /**
         * @deprecated use the native el.tagName instead
         *
         * @param {string} tagName
         * @returns {string} the tag name
         */
        // eslint-disable-next-line class-methods-use-this
        getScopedTagName(tagName) {
          return tagName;
        }

        /**
         * @deprecated use the native el.tagName instead
         *
         * @param {string} tagName
         * @returns {string} the tag name
         */
        // eslint-disable-next-line class-methods-use-this
        static getScopedTagName(tagName) {
          return tagName;
        }
      };

    const ScopedElementsMixin = dedupeMixin(ScopedElementsMixinImplementation);

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */var s$4,e$3,r$2,h$2;const o$4={toAttribute(t,i){switch(i){case Boolean:t=t?"":null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,i){let s=t;switch(i){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t);}catch(t){s=null;}}return s}},n$4=(t,i)=>i!==t&&(i==i||t==t),l$2={attribute:!0,type:String,converter:o$4,reflect:!1,hasChanged:n$4};class a$2 extends HTMLElement{constructor(){super(),this._$Et=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Ei=null,this.o();}static addInitializer(t){var i;null!==(i=this.l)&&void 0!==i||(this.l=[]),this.l.push(t);}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach(((i,s)=>{const e=this._$Eh(s,i);void 0!==e&&(this._$Eu.set(e,s),t.push(e));})),t}static createProperty(t,i=l$2){if(i.state&&(i.attribute=!1),this.finalize(),this.elementProperties.set(t,i),!i.noAccessor&&!this.prototype.hasOwnProperty(t)){const s="symbol"==typeof t?Symbol():"__"+t,e=this.getPropertyDescriptor(t,s,i);void 0!==e&&Object.defineProperty(this.prototype,t,e);}}static getPropertyDescriptor(t,i,s){return {get(){return this[i]},set(e){const r=this[t];this[i]=e,this.requestUpdate(t,r,s);},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||l$2}static finalize(){if(this.hasOwnProperty("finalized"))return !1;this.finalized=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),this.elementProperties=new Map(t.elementProperties),this._$Eu=new Map,this.hasOwnProperty("properties")){const t=this.properties,i=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const s of i)this.createProperty(s,t[s]);}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(i){const s=[];if(Array.isArray(i)){const e=new Set(i.flat(1/0).reverse());for(const i of e)s.unshift(i$4(i));}else void 0!==i&&s.push(i$4(i));return s}static _$Eh(t,i){const s=i.attribute;return !1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}o(){var t;this._$Ev=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$Ep(),this.requestUpdate(),null===(t=this.constructor.l)||void 0===t||t.forEach((t=>t(this)));}addController(t){var i,s;(null!==(i=this._$Em)&&void 0!==i?i:this._$Em=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(s=t.hostConnected)||void 0===s||s.call(t));}removeController(t){var i;null===(i=this._$Em)||void 0===i||i.splice(this._$Em.indexOf(t)>>>0,1);}_$Ep(){this.constructor.elementProperties.forEach(((t,i)=>{this.hasOwnProperty(i)&&(this._$Et.set(i,this[i]),delete this[i]);}));}createRenderRoot(){var t;const s=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return S$1(s,this.constructor.elementStyles),s}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$Em)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostConnected)||void 0===i?void 0:i.call(t)}));}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$Em)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostDisconnected)||void 0===i?void 0:i.call(t)}));}attributeChangedCallback(t,i,s){this._$AK(t,s);}_$Eg(t,i,s=l$2){var e,r;const h=this.constructor._$Eh(t,s);if(void 0!==h&&!0===s.reflect){const n=(null!==(r=null===(e=s.converter)||void 0===e?void 0:e.toAttribute)&&void 0!==r?r:o$4.toAttribute)(i,s.type);this._$Ei=t,null==n?this.removeAttribute(h):this.setAttribute(h,n),this._$Ei=null;}}_$AK(t,i){var s,e,r;const h=this.constructor,n=h._$Eu.get(t);if(void 0!==n&&this._$Ei!==n){const t=h.getPropertyOptions(n),l=t.converter,a=null!==(r=null!==(e=null===(s=l)||void 0===s?void 0:s.fromAttribute)&&void 0!==e?e:"function"==typeof l?l:null)&&void 0!==r?r:o$4.fromAttribute;this._$Ei=n,this[n]=a(i,t.type),this._$Ei=null;}}requestUpdate(t,i,s){let e=!0;void 0!==t&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||n$4)(this[t],i)?(this._$AL.has(t)||this._$AL.set(t,i),!0===s.reflect&&this._$Ei!==t&&(void 0===this._$ES&&(this._$ES=new Map),this._$ES.set(t,s))):e=!1),!this.isUpdatePending&&e&&(this._$Ev=this._$EC());}async _$EC(){this.isUpdatePending=!0;try{await this._$Ev;}catch(t){Promise.reject(t);}const t=this.performUpdate();return null!=t&&await t,!this.isUpdatePending}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Et&&(this._$Et.forEach(((t,i)=>this[i]=t)),this._$Et=void 0);let i=!1;const s=this._$AL;try{i=this.shouldUpdate(s),i?(this.willUpdate(s),null===(t=this._$Em)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostUpdate)||void 0===i?void 0:i.call(t)})),this.update(s)):this._$E_();}catch(t){throw i=!1,this._$E_(),t}i&&this._$AE(s);}willUpdate(t){}_$AE(t){var i;null===(i=this._$Em)||void 0===i||i.forEach((t=>{var i;return null===(i=t.hostUpdated)||void 0===i?void 0:i.call(t)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t);}_$E_(){this._$AL=new Map,this.isUpdatePending=!1;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Ev}shouldUpdate(t){return !0}update(t){void 0!==this._$ES&&(this._$ES.forEach(((t,i)=>this._$Eg(i,this[i],t))),this._$ES=void 0),this._$E_();}updated(t){}firstUpdated(t){}}a$2.finalized=!0,a$2.elementProperties=new Map,a$2.elementStyles=[],a$2.shadowRootOptions={mode:"open"},null===(e$3=(s$4=globalThis).reactiveElementPlatformSupport)||void 0===e$3||e$3.call(s$4,{ReactiveElement:a$2}),(null!==(r$2=(h$2=globalThis).reactiveElementVersions)&&void 0!==r$2?r$2:h$2.reactiveElementVersions=[]).push("1.0.0-rc.3");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    var t$3,i$3,s$3,e$2;const o$3=globalThis.trustedTypes,n$3=o$3?o$3.createPolicy("lit-html",{createHTML:t=>t}):void 0,l$1=`lit$${(Math.random()+"").slice(9)}$`,h$1="?"+l$1,r$1=`<${h$1}>`,u=document,c=(t="")=>u.createComment(t),d=t=>null===t||"object"!=typeof t&&"function"!=typeof t,v=Array.isArray,a$1=t=>{var i;return v(t)||"function"==typeof(null===(i=t)||void 0===i?void 0:i[Symbol.iterator])},f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,m=/>/g,$=/>|[ 	\n\r](?:([^\s"'>=/]+)([ 	\n\r]*=[ 	\n\r]*(?:[^ 	\n\r"'`<>=]|("|')|))|$)/g,g=/'/g,p=/"/g,y=/^(?:script|style|textarea)$/i,b=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),T=b(1),w=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),C=new WeakMap,P=(t,i,s)=>{var e,o;const n=null!==(e=null==s?void 0:s.renderBefore)&&void 0!==e?e:i;let l=n._$litPart$;if(void 0===l){const t=null!==(o=null==s?void 0:s.renderBefore)&&void 0!==o?o:null;n._$litPart$=l=new k(i.insertBefore(c(),t),t,void 0,null!=s?s:{});}return l._$AI(t),l},V=u.createTreeWalker(u,129,null,!1),E=(t,i)=>{const s=t.length-1,e=[];let o,h=2===i?"<svg>":"",u=f;for(let i=0;i<s;i++){const s=t[i];let n,c,d=-1,v=0;for(;v<s.length&&(u.lastIndex=v,c=u.exec(s),null!==c);)v=u.lastIndex,u===f?"!--"===c[1]?u=_:void 0!==c[1]?u=m:void 0!==c[2]?(y.test(c[2])&&(o=RegExp("</"+c[2],"g")),u=$):void 0!==c[3]&&(u=$):u===$?">"===c[0]?(u=null!=o?o:f,d=-1):void 0===c[1]?d=-2:(d=u.lastIndex-c[2].length,n=c[1],u=void 0===c[3]?$:'"'===c[3]?p:g):u===p||u===g?u=$:u===_||u===m?u=f:(u=$,o=void 0);const a=u===$&&t[i+1].startsWith("/>")?" ":"";h+=u===f?s+r$1:d>=0?(e.push(n),s.slice(0,d)+"$lit$"+s.slice(d)+l$1+a):s+l$1+(-2===d?(e.push(void 0),i):a);}const c=h+(t[s]||"<?>")+(2===i?"</svg>":"");return [void 0!==n$3?n$3.createHTML(c):c,e]};class M{constructor({strings:t,_$litType$:i},s){let e;this.parts=[];let n=0,r=0;const u=t.length-1,d=this.parts,[v,a]=E(t,i);if(this.el=M.createElement(v,s),V.currentNode=this.el.content,2===i){const t=this.el.content,i=t.firstChild;i.remove(),t.append(...i.childNodes);}for(;null!==(e=V.nextNode())&&d.length<u;){if(1===e.nodeType){if(e.hasAttributes()){const t=[];for(const i of e.getAttributeNames())if(i.endsWith("$lit$")||i.startsWith(l$1)){const s=a[r++];if(t.push(i),void 0!==s){const t=e.getAttribute(s.toLowerCase()+"$lit$").split(l$1),i=/([.?@])?(.*)/.exec(s);d.push({type:1,index:n,name:i[2],strings:t,ctor:"."===i[1]?I:"?"===i[1]?L:"@"===i[1]?R:H});}else d.push({type:6,index:n});}for(const i of t)e.removeAttribute(i);}if(y.test(e.tagName)){const t=e.textContent.split(l$1),i=t.length-1;if(i>0){e.textContent=o$3?o$3.emptyScript:"";for(let s=0;s<i;s++)e.append(t[s],c()),V.nextNode(),d.push({type:2,index:++n});e.append(t[i],c());}}}else if(8===e.nodeType)if(e.data===h$1)d.push({type:2,index:n});else {let t=-1;for(;-1!==(t=e.data.indexOf(l$1,t+1));)d.push({type:7,index:n}),t+=l$1.length-1;}n++;}}static createElement(t,i){const s=u.createElement("template");return s.innerHTML=t,s}}function N(t,i,s=t,e){var o,n,l,h;if(i===w)return i;let r=void 0!==e?null===(o=s._$Cl)||void 0===o?void 0:o[e]:s._$Cu;const u=d(i)?void 0:i._$litDirective$;return (null==r?void 0:r.constructor)!==u&&(null===(n=null==r?void 0:r._$AO)||void 0===n||n.call(r,!1),void 0===u?r=void 0:(r=new u(t),r._$AT(t,s,e)),void 0!==e?(null!==(l=(h=s)._$Cl)&&void 0!==l?l:h._$Cl=[])[e]=r:s._$Cu=r),void 0!==r&&(i=N(t,r._$AS(t,i.values),r,e)),i}class S{constructor(t,i){this.v=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get _$AU(){return this._$AM._$AU}p(t){var i;const{el:{content:s},parts:e}=this._$AD,o=(null!==(i=null==t?void 0:t.creationScope)&&void 0!==i?i:u).importNode(s,!0);V.currentNode=o;let n=V.nextNode(),l=0,h=0,r=e[0];for(;void 0!==r;){if(l===r.index){let i;2===r.type?i=new k(n,n.nextSibling,this,t):1===r.type?i=new r.ctor(n,r.name,r.strings,this,t):6===r.type&&(i=new z(n,this,t)),this.v.push(i),r=e[++h];}l!==(null==r?void 0:r.index)&&(n=V.nextNode(),l++);}return o}m(t){let i=0;for(const s of this.v)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class k{constructor(t,i,s,e){this.type=2,this._$C_=!0,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e;}get _$AU(){var t,i;return null!==(i=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==i?i:this._$C_}get parentNode(){return this._$AA.parentNode}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=N(this,t,i),d(t)?t===A||null==t||""===t?(this._$AH!==A&&this._$AR(),this._$AH=A):t!==this._$AH&&t!==w&&this.$(t):void 0!==t._$litType$?this.T(t):void 0!==t.nodeType?this.A(t):a$1(t)?this.M(t):this.$(t);}C(t,i=this._$AB){return this._$AA.parentNode.insertBefore(t,i)}A(t){this._$AH!==t&&(this._$AR(),this._$AH=this.C(t));}$(t){const i=this._$AA.nextSibling;null!==i&&3===i.nodeType&&(null===this._$AB?null===i.nextSibling:i===this._$AB.previousSibling)?i.data=t:this.A(u.createTextNode(t)),this._$AH=t;}T(t){var i;const{values:s,_$litType$:e}=t,o="number"==typeof e?this._$AC(t):(void 0===e.el&&(e.el=M.createElement(e.h,this.options)),e);if((null===(i=this._$AH)||void 0===i?void 0:i._$AD)===o)this._$AH.m(s);else {const t=new S(o,this),i=t.p(this.options);t.m(s),this.A(i),this._$AH=t;}}_$AC(t){let i=C.get(t.strings);return void 0===i&&C.set(t.strings,i=new M(t)),i}M(t){v(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const o of t)e===i.length?i.push(s=new k(this.C(c()),this.C(c()),this,this.options)):s=i[e],s._$AI(o),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){var s;for(null===(s=this._$AP)||void 0===s||s.call(this,!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){var i;void 0===this._$AM&&(this._$C_=t,null===(i=this._$AP)||void 0===i||i.call(this,t));}}class H{constructor(t,i,s,e,o){this.type=1,this._$AH=A,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(A),this.strings=s):this._$AH=A;}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,i=this,s,e){const o=this.strings;let n=!1;if(void 0===o)t=N(this,t,i,0),n=!d(t)||t!==this._$AH&&t!==w,n&&(this._$AH=t);else {const e=t;let l,h;for(t=o[0],l=0;l<o.length-1;l++)h=N(this,e[s+l],i,l),h===w&&(h=this._$AH[l]),n||(n=!d(h)||h!==this._$AH[l]),h===A?t=A:t!==A&&(t+=(null!=h?h:"")+o[l+1]),this._$AH[l]=h;}n&&!e&&this.P(t);}P(t){t===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"");}}class I extends H{constructor(){super(...arguments),this.type=3;}P(t){this.element[this.name]=t===A?void 0:t;}}class L extends H{constructor(){super(...arguments),this.type=4;}P(t){t&&t!==A?this.element.setAttribute(this.name,""):this.element.removeAttribute(this.name);}}class R extends H{constructor(){super(...arguments),this.type=5;}_$AI(t,i=this){var s;if((t=null!==(s=N(this,t,i,0))&&void 0!==s?s:A)===w)return;const e=this._$AH,o=t===A&&e!==A||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,n=t!==A&&(e===A||o);o&&this.element.removeEventListener(this.name,this,e),n&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){var i,s;"function"==typeof this._$AH?this._$AH.call(null!==(s=null===(i=this.options)||void 0===i?void 0:i.host)&&void 0!==s?s:this.element,t):this._$AH.handleEvent(t);}}class z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){N(this,t);}}null===(i$3=(t$3=globalThis).litHtmlPlatformSupport)||void 0===i$3||i$3.call(t$3,M,k),(null!==(s$3=(e$2=globalThis).litHtmlVersions)&&void 0!==s$3?s$3:e$2.litHtmlVersions=[]).push("2.0.0-rc.4");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */var i$2,l,o$2,s$2,n$2,a;class h extends a$2{constructor(){super(...arguments),this.renderOptions={host:this},this._$Dt=void 0;}createRenderRoot(){var t,e;const r=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=r.firstChild),r}update(t){const r=this.render();super.update(t),this._$Dt=P(r,this.renderRoot,this.renderOptions);}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Dt)||void 0===t||t.setConnected(!0);}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Dt)||void 0===t||t.setConnected(!1);}render(){return w}}h.finalized=!0,h._$litElement$=!0,null===(l=(i$2=globalThis).litElementHydrateSupport)||void 0===l||l.call(i$2,{LitElement:h}),null===(s$2=(o$2=globalThis).litElementPlatformSupport)||void 0===s$2||s$2.call(o$2,{LitElement:h});(null!==(n$2=(a=globalThis).litElementVersions)&&void 0!==n$2?n$2:a.litElementVersions=[]).push("3.0.0-rc.3");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const i$1=(i,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(n){n.createProperty(e.key,i);}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this));},finisher(n){n.createProperty(e.key,i);}};function e$1(e){return (n,t)=>void 0!==t?((i,e,n)=>{e.constructor.createProperty(n,i);})(e,n,t):i$1(e,n)}

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */function t$2(t){return e$1({...t,state:!0})}

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const o$1=({finisher:e,descriptor:t})=>(o,n)=>{var r;if(void 0===n){const n=null!==(r=o.originalKey)&&void 0!==r?r:o.key,i=null!=t?{kind:"method",placement:"prototype",key:n,descriptor:t(o.key)}:{...o,key:n};return null!=e&&(i.finisher=function(t){e(t,n);}),i}{const r=o.constructor;void 0!==t&&Object.defineProperty(o,n,t(n)),null==e||e(r,n);}};

    /**
     * @license
     * Copyright 2021 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    class s$1 extends Event{constructor(s,t,e){super("context-request",{bubbles:!0,composed:!0}),this.context=s,this.callback=t,this.multiple=e;}}

    /**
     * @license
     * Copyright 2021 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    function n$1(n,e){return {name:n,initialValue:e}}

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const t$1={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},e=t=>(...e)=>({_$litDirective$:t,values:e});class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i;}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}

    /**
     * @license
     * Copyright 2021 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    class t{constructor(t){this.callbacks=new Set,this.updateContext=()=>{this.callbacks.forEach((([t,s])=>t(this.o,s)));},void 0!==t&&(this.value=t);}get value(){return this.o}set value(t){this.setValue(t);}setValue(t,s=!1){let i=!1;t!==this.o&&(i=!0),this.o=t,(i||s)&&this.updateContext();}addCallback(t,s){if(s){const s=[t,()=>{this.callbacks.delete(s);}];this.callbacks.add(s);}t(this.value);}clearCallbacks(){this.callbacks.clear();}}

    class o extends i{constructor(t){if(super(t),this.onContextRequest=t=>{var i;t.context===this.i&&(t.stopPropagation(),null===(i=this.t)||void 0===i||i.addCallback(t.callback,t.multiple));},t.type!==t$1.ELEMENT)throw Error("The `provide` directive is only allowed on element bindings")}render(t,i){return w}update(t$1,[i,e]){const r=this.render(i,e),o=t$1.element;return void 0===this.t&&(this.t=new t(e)),this.l!==o&&(this.l&&this.l.removeEventListener("context-request",this.onContextRequest),this.l=o),this.i=i,this.t.value=e,null==o||o.addEventListener("context-request",this.onContextRequest),r}}const n=e(o);

    /**
     * @license
     * Copyright 2021 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */class s{constructor(t,s,i,h=!1){this.host=t,this.context=s,this.callback=i,this.multiple=h,this.provided=!1,this.host.addController(this);}hostConnected(){this.host.dispatchEvent(new s$1(this.context,((t,s)=>{this.dispose&&(this.dispose!==s&&this.dispose(),this.multiple||this.dispose()),this.provided&&!this.multiple||(this.provided=!0,this.callback(t,s)),this.dispose=s;}),this.multiple));}hostDisconnected(){this.dispose&&(this.dispose(),this.dispose=void 0);}}

    /**
     * @license
     * Copyright 2021 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */function r({context:r,multiple:o}){return o$1({finisher:(e,n)=>{e.addInitializer((e=>{e.addController(new s(e,r,(t=>{e[n]=t;}),o));}));}})}

    class StoreController {
        constructor(host, store) {
            this.host = host;
            this.store = store;
            host.addController(this);
        }
        hostConnected() {
            this._unsubscribe = this.store.subscribe((value) => {
                this.value = value;
                this.host.requestUpdate();
            });
        }
        hostDisconnected() {
            this._unsubscribe();
        }
    }

    const synContext = n$1('syn-context', undefined);
    const synSessionContext = n$1('syn-session-context', undefined);

    var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    class SynSession extends ScopedElementsMixin(h) {
        render() {
            var _a;
            return T `<slot
      ${n(synSessionContext, (_a = this.synStore) === null || _a === void 0 ? void 0 : _a.sessionStore(this.sessionHash))}
    ></slot>`;
        }
        static get styles() {
            return r$3 `
      :host {
        display: contents;
      }
    `;
        }
    }
    __decorate$2([
        e$1({ attribute: 'session-hash' })
    ], SynSession.prototype, "sessionHash", void 0);
    __decorate$2([
        r({ context: synContext, multiple: true })
    ], SynSession.prototype, "synStore", void 0);

    var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Context provider element to serve as a container for all the
     * other syn elements
     */
    class SynContext extends ScopedElementsMixin(h) {
        updated(cv) {
            super.updated(cv);
            if (cv.has('store')) {
                this._activeSession = new StoreController(this, this.store.activeSession);
            }
        }
        render() {
            var _a, _b;
            return T `
      <syn-session
        .sessionHash=${(_b = (_a = this._activeSession) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.hash}
        ${n(synContext, this.store)}
      >
        <slot></slot>
      </syn-session>
    `;
        }
        static get styles() {
            return r$3 `
      :host {
        display: contents;
      }
    `;
        }
        static get scopedElements() {
            return {
                'syn-session': SynSession,
            };
        }
    }
    __decorate$1([
        e$1()
    ], SynContext.prototype, "store", void 0);

    var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    class SynFolks extends ScopedElementsMixin(h) {
        updated(changedValues) {
            super.updated(changedValues);
            if (changedValues.has('session')) {
                this._folks = this.session
                    ? new StoreController(this, this.session.folks)
                    : undefined;
            }
        }
        render() {
            var _a;
            if (!this.session)
                return T `There is no active session`;
            return T ` ${(_a = this._folks) === null || _a === void 0 ? void 0 : _a.value} `;
        }
    }
    __decorate([
        r({ context: synSessionContext, multiple: true })
    ], SynFolks.prototype, "session", void 0);
    __decorate([
        t$2()
    ], SynFolks.prototype, "_folks", void 0);

    var AppStatusFilter$1;
    (function (AppStatusFilter) {
        AppStatusFilter["Enabled"] = "enabled";
        AppStatusFilter["Disabled"] = "disabled";
        AppStatusFilter["Running"] = "running";
        AppStatusFilter["Stopped"] = "stopped";
        AppStatusFilter["Paused"] = "paused";
    })(AppStatusFilter$1 || (AppStatusFilter$1 = {}));

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

    var TEXT_ENCODING_AVAILABLE$1 = typeof process !== "undefined" &&
        process.env.TEXT_ENCODING !== "never" &&
        typeof TextEncoder !== "undefined" &&
        typeof TextDecoder !== "undefined";
    var STR_SIZE_MAX = 4294967295; // uint32_max
    function utf8Count$1(str) {
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
    function utf8EncodeJs$1(str, output, outputOffset) {
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
    var sharedTextEncoder$1 = TEXT_ENCODING_AVAILABLE$1 ? new TextEncoder() : undefined;
    var TEXT_ENCODER_THRESHOLD$1 = !TEXT_ENCODING_AVAILABLE$1
        ? STR_SIZE_MAX
        : typeof process !== "undefined" && process.env.TEXT_ENCODING !== "force"
            ? 200
            : 0;
    function utf8EncodeTEencode$1(str, output, outputOffset) {
        output.set(sharedTextEncoder$1.encode(str), outputOffset);
    }
    function utf8EncodeTEencodeInto$1(str, output, outputOffset) {
        sharedTextEncoder$1.encodeInto(str, output.subarray(outputOffset));
    }
    var utf8EncodeTE$1 = (sharedTextEncoder$1 === null || sharedTextEncoder$1 === void 0 ? void 0 : sharedTextEncoder$1.encodeInto) ? utf8EncodeTEencodeInto$1 : utf8EncodeTEencode$1;
    var CHUNK_SIZE$1 = 4096;
    function utf8DecodeJs$1(bytes, inputOffset, byteLength) {
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
            if (units.length >= CHUNK_SIZE$1) {
                result += String.fromCharCode.apply(String, units);
                units.length = 0;
            }
        }
        if (units.length > 0) {
            result += String.fromCharCode.apply(String, units);
        }
        return result;
    }
    var sharedTextDecoder$1 = TEXT_ENCODING_AVAILABLE$1 ? new TextDecoder() : null;
    var TEXT_DECODER_THRESHOLD$1 = !TEXT_ENCODING_AVAILABLE$1
        ? STR_SIZE_MAX
        : typeof process !== "undefined" && process.env.TEXT_DECODER !== "force"
            ? 200
            : 0;
    function utf8DecodeTD$1(bytes, inputOffset, byteLength) {
        var stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
        return sharedTextDecoder$1.decode(stringBytes);
    }

    /**
     * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
     */
    var ExtData$1 = /** @class */ (function () {
        function ExtData(type, data) {
            this.type = type;
            this.data = data;
        }
        return ExtData;
    }());

    // DataView extension to handle int64 / uint64,
    // where the actual range is 53-bits integer (a.k.a. safe integer)
    function setUint64$1(view, offset, value) {
        var high = value / 4294967296;
        var low = value; // high bits are truncated by DataView
        view.setUint32(offset, high);
        view.setUint32(offset + 4, low);
    }
    function setInt64$1(view, offset, value) {
        var high = Math.floor(value / 4294967296);
        var low = value; // high bits are truncated by DataView
        view.setUint32(offset, high);
        view.setUint32(offset + 4, low);
    }
    function getInt64$1(view, offset) {
        var high = view.getInt32(offset);
        var low = view.getUint32(offset + 4);
        return high * 4294967296 + low;
    }
    function getUint64$1(view, offset) {
        var high = view.getUint32(offset);
        var low = view.getUint32(offset + 4);
        return high * 4294967296 + low;
    }

    // https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type
    var EXT_TIMESTAMP$1 = -1;
    var TIMESTAMP32_MAX_SEC$1 = 0x100000000 - 1; // 32-bit unsigned int
    var TIMESTAMP64_MAX_SEC$1 = 0x400000000 - 1; // 34-bit unsigned int
    function encodeTimeSpecToTimestamp$1(_a) {
        var sec = _a.sec, nsec = _a.nsec;
        if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC$1) {
            // Here sec >= 0 && nsec >= 0
            if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC$1) {
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
            setInt64$1(view, 4, sec);
            return rv;
        }
    }
    function encodeDateToTimeSpec$1(date) {
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
    function encodeTimestampExtension$1(object) {
        if (object instanceof Date) {
            var timeSpec = encodeDateToTimeSpec$1(object);
            return encodeTimeSpecToTimestamp$1(timeSpec);
        }
        else {
            return null;
        }
    }
    function decodeTimestampToTimeSpec$1(data) {
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
                var sec = getInt64$1(view, 4);
                var nsec = view.getUint32(0);
                return { sec: sec, nsec: nsec };
            }
            default:
                throw new Error("Unrecognized data size for timestamp: " + data.length);
        }
    }
    function decodeTimestampExtension$1(data) {
        var timeSpec = decodeTimestampToTimeSpec$1(data);
        return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
    }
    var timestampExtension$1 = {
        type: EXT_TIMESTAMP$1,
        encode: encodeTimestampExtension$1,
        decode: decodeTimestampExtension$1,
    };

    // ExtensionCodec to handle MessagePack extensions
    var ExtensionCodec$1 = /** @class */ (function () {
        function ExtensionCodec() {
            // built-in extensions
            this.builtInEncoders = [];
            this.builtInDecoders = [];
            // custom extensions
            this.encoders = [];
            this.decoders = [];
            this.register(timestampExtension$1);
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
                var encodeExt = this.builtInEncoders[i];
                if (encodeExt != null) {
                    var data = encodeExt(object, context);
                    if (data != null) {
                        var type = -1 - i;
                        return new ExtData$1(type, data);
                    }
                }
            }
            // custom extensions
            for (var i = 0; i < this.encoders.length; i++) {
                var encodeExt = this.encoders[i];
                if (encodeExt != null) {
                    var data = encodeExt(object, context);
                    if (data != null) {
                        var type = i;
                        return new ExtData$1(type, data);
                    }
                }
            }
            if (object instanceof ExtData$1) {
                // to keep ExtData as is
                return object;
            }
            return null;
        };
        ExtensionCodec.prototype.decode = function (data, type, context) {
            var decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
            if (decodeExt) {
                return decodeExt(data, type, context);
            }
            else {
                // decode() does not fail, returns ExtData instead.
                return new ExtData$1(type, data);
            }
        };
        ExtensionCodec.defaultCodec = new ExtensionCodec();
        return ExtensionCodec;
    }());

    function ensureUint8Array$1(buffer) {
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
    function createDataView$1(buffer) {
        if (buffer instanceof ArrayBuffer) {
            return new DataView(buffer);
        }
        var bufferView = ensureUint8Array$1(buffer);
        return new DataView(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
    }

    var DEFAULT_MAX_DEPTH$1 = 100;
    var DEFAULT_INITIAL_BUFFER_SIZE$1 = 2048;
    var Encoder$1 = /** @class */ (function () {
        function Encoder(extensionCodec, context, maxDepth, initialBufferSize, sortKeys, forceFloat32, ignoreUndefined, forceIntegerToFloat) {
            if (extensionCodec === void 0) { extensionCodec = ExtensionCodec$1.defaultCodec; }
            if (context === void 0) { context = undefined; }
            if (maxDepth === void 0) { maxDepth = DEFAULT_MAX_DEPTH$1; }
            if (initialBufferSize === void 0) { initialBufferSize = DEFAULT_INITIAL_BUFFER_SIZE$1; }
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
            if (strLength > TEXT_ENCODER_THRESHOLD$1) {
                var byteLength = utf8Count$1(object);
                this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
                this.writeStringHeader(byteLength);
                utf8EncodeTE$1(object, this.bytes, this.pos);
                this.pos += byteLength;
            }
            else {
                var byteLength = utf8Count$1(object);
                this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
                this.writeStringHeader(byteLength);
                utf8EncodeJs$1(object, this.bytes, this.pos);
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
            var bytes = ensureUint8Array$1(object);
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
            setUint64$1(this.view, this.pos, value);
            this.pos += 8;
        };
        Encoder.prototype.writeI64 = function (value) {
            this.ensureBufferSizeToWrite(8);
            setInt64$1(this.view, this.pos, value);
            this.pos += 8;
        };
        return Encoder;
    }());

    var defaultEncodeOptions$1 = {};
    /**
     * It encodes `value` in the MessagePack format and
     * returns a byte buffer.
     *
     * The returned buffer is a slice of a larger `ArrayBuffer`, so you have to use its `#byteOffset` and `#byteLength` in order to convert it to another typed arrays including NodeJS `Buffer`.
     */
    function encode$2(value, options) {
        if (options === void 0) { options = defaultEncodeOptions$1; }
        var encoder = new Encoder$1(options.extensionCodec, options.context, options.maxDepth, options.initialBufferSize, options.sortKeys, options.forceFloat32, options.ignoreUndefined, options.forceIntegerToFloat);
        return encoder.encode(value);
    }

    function prettyByte$1(byte) {
        return (byte < 0 ? "-" : "") + "0x" + Math.abs(byte).toString(16).padStart(2, "0");
    }

    var DEFAULT_MAX_KEY_LENGTH$1 = 16;
    var DEFAULT_MAX_LENGTH_PER_KEY$1 = 16;
    var CachedKeyDecoder$1 = /** @class */ (function () {
        function CachedKeyDecoder(maxKeyLength, maxLengthPerKey) {
            if (maxKeyLength === void 0) { maxKeyLength = DEFAULT_MAX_KEY_LENGTH$1; }
            if (maxLengthPerKey === void 0) { maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY$1; }
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
            FIND_CHUNK: for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
                var record = records_1[_i];
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
            var value = utf8DecodeJs$1(bytes, inputOffset, byteLength);
            // Ensure to copy a slice of bytes because the byte may be NodeJS Buffer and Buffer#slice() returns a reference to its internal ArrayBuffer.
            var slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
            this.store(slicedCopyOfBytes, value);
            return value;
        };
        return CachedKeyDecoder;
    }());

    var __awaiter$7 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
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
    var __asyncValues$1 = (undefined && undefined.__asyncValues) || function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
    var isValidMapKeyType$1 = function (key) {
        var keyType = typeof key;
        return keyType === "string" || keyType === "number";
    };
    var HEAD_BYTE_REQUIRED$1 = -1;
    var EMPTY_VIEW$1 = new DataView(new ArrayBuffer(0));
    var EMPTY_BYTES$1 = new Uint8Array(EMPTY_VIEW$1.buffer);
    // IE11: Hack to support IE11.
    // IE11: Drop this hack and just use RangeError when IE11 is obsolete.
    var DataViewIndexOutOfBoundsError$1 = (function () {
        try {
            // IE11: The spec says it should throw RangeError,
            // IE11: but in IE11 it throws TypeError.
            EMPTY_VIEW$1.getInt8(0);
        }
        catch (e) {
            return e.constructor;
        }
        throw new Error("never reached");
    })();
    var MORE_DATA$1 = new DataViewIndexOutOfBoundsError$1("Insufficient data");
    var DEFAULT_MAX_LENGTH = 4294967295; // uint32_max
    var sharedCachedKeyDecoder$1 = new CachedKeyDecoder$1();
    var Decoder$1 = /** @class */ (function () {
        function Decoder(extensionCodec, context, maxStrLength, maxBinLength, maxArrayLength, maxMapLength, maxExtLength, keyDecoder) {
            if (extensionCodec === void 0) { extensionCodec = ExtensionCodec$1.defaultCodec; }
            if (context === void 0) { context = undefined; }
            if (maxStrLength === void 0) { maxStrLength = DEFAULT_MAX_LENGTH; }
            if (maxBinLength === void 0) { maxBinLength = DEFAULT_MAX_LENGTH; }
            if (maxArrayLength === void 0) { maxArrayLength = DEFAULT_MAX_LENGTH; }
            if (maxMapLength === void 0) { maxMapLength = DEFAULT_MAX_LENGTH; }
            if (maxExtLength === void 0) { maxExtLength = DEFAULT_MAX_LENGTH; }
            if (keyDecoder === void 0) { keyDecoder = sharedCachedKeyDecoder$1; }
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
            this.view = EMPTY_VIEW$1;
            this.bytes = EMPTY_BYTES$1;
            this.headByte = HEAD_BYTE_REQUIRED$1;
            this.stack = [];
        }
        Decoder.prototype.reinitializeState = function () {
            this.totalPos = 0;
            this.headByte = HEAD_BYTE_REQUIRED$1;
        };
        Decoder.prototype.setBuffer = function (buffer) {
            this.bytes = ensureUint8Array$1(buffer);
            this.view = createDataView$1(this.bytes);
            this.pos = 0;
        };
        Decoder.prototype.appendBuffer = function (buffer) {
            if (this.headByte === HEAD_BYTE_REQUIRED$1 && !this.hasRemaining()) {
                this.setBuffer(buffer);
            }
            else {
                // retried because data is insufficient
                var remainingData = this.bytes.subarray(this.pos);
                var newData = ensureUint8Array$1(buffer);
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
        Decoder.prototype.decodeMulti = function (buffer) {
            return __generator$1(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.reinitializeState();
                        this.setBuffer(buffer);
                        _a.label = 1;
                    case 1:
                        if (!this.hasRemaining()) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.doDecodeSync()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        };
        Decoder.prototype.decodeAsync = function (stream) {
            var stream_1, stream_1_1;
            var e_1, _a;
            return __awaiter$7(this, void 0, void 0, function () {
                var decoded, object, buffer, e_1_1, _b, headByte, pos, totalPos;
                return __generator$1(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            decoded = false;
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 6, 7, 12]);
                            stream_1 = __asyncValues$1(stream);
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
                                if (!(e instanceof DataViewIndexOutOfBoundsError$1)) {
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
                            throw new RangeError("Insufficient data in parsing " + prettyByte$1(headByte) + " at " + totalPos + " (" + pos + " in the current buffer)");
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
            return __asyncGenerator$1(this, arguments, function decodeMultiAsync_1() {
                var isArrayHeaderRequired, arrayItemsLeft, stream_2, stream_2_1, buffer, e_2, e_3_1;
                var e_3, _a;
                return __generator$1(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            isArrayHeaderRequired = isArray;
                            arrayItemsLeft = -1;
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 13, 14, 19]);
                            stream_2 = __asyncValues$1(stream);
                            _b.label = 2;
                        case 2: return [4 /*yield*/, __await$1(stream_2.next())];
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
                            return [4 /*yield*/, __await$1(this.doDecodeSync())];
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
                            if (!(e_2 instanceof DataViewIndexOutOfBoundsError$1)) {
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
                            return [4 /*yield*/, __await$1(_a.call(stream_2))];
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
                    throw new Error("Unrecognized type byte: " + prettyByte$1(headByte));
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
                        if (!isValidMapKeyType$1(object)) {
                            throw new Error("The type of key must be string or number but " + typeof object);
                        }
                        state.key = object;
                        state.type = 2 /* MAP_VALUE */;
                        continue DECODE;
                    }
                    else {
                        // it must be `state.type === State.MAP_VALUE` here
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
            if (this.headByte === HEAD_BYTE_REQUIRED$1) {
                this.headByte = this.readU8();
                // console.log("headByte", prettyByte(this.headByte));
            }
            return this.headByte;
        };
        Decoder.prototype.complete = function () {
            this.headByte = HEAD_BYTE_REQUIRED$1;
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
                        throw new Error("Unrecognized array type byte: " + prettyByte$1(headByte));
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
                throw MORE_DATA$1;
            }
            var offset = this.pos + headerOffset;
            var object;
            if (this.stateIsMapKey() && ((_a = this.keyDecoder) === null || _a === void 0 ? void 0 : _a.canBeCached(byteLength))) {
                object = this.keyDecoder.decode(this.bytes, offset, byteLength);
            }
            else if (byteLength > TEXT_DECODER_THRESHOLD$1) {
                object = utf8DecodeTD$1(this.bytes, offset, byteLength);
            }
            else {
                object = utf8DecodeJs$1(this.bytes, offset, byteLength);
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
                throw MORE_DATA$1;
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
            var value = getUint64$1(this.view, this.pos);
            this.pos += 8;
            return value;
        };
        Decoder.prototype.readI64 = function () {
            var value = getInt64$1(this.view, this.pos);
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

    var defaultDecodeOptions$1 = {};
    /**
     * It decodes a single MessagePack object in a buffer.
     *
     * This is a synchronous decoding function.
     * See other variants for asynchronous decoding: {@link decodeAsync()}, {@link decodeStream()}, or {@link decodeArrayStream()}.
     */
    function decode$2(buffer, options) {
        if (options === void 0) { options = defaultDecodeOptions$1; }
        var decoder = new Decoder$1(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
        return decoder.decode(buffer);
    }

    var __awaiter$6 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    /**
     * A Websocket client which can make requests and receive responses,
     * as well as send and receive signals
     *
     * Uses Holochain's websocket WireMessage for communication.
     */
    class WsClient$1 {
        constructor(socket, signalCb) {
            this.socket = socket;
            this.pendingRequests = {};
            this.index = 0;
            // TODO: allow adding signal handlers later
            this.alreadyWarnedNoSignalCb = false;
            socket.onmessage = (encodedMsg) => __awaiter$6(this, void 0, void 0, function* () {
                let data = encodedMsg.data;
                // If data is not a buffer (nodejs), it will be a blob (browser)
                if (typeof Buffer === "undefined" || !Buffer.isBuffer(data)) {
                    data = yield data.arrayBuffer();
                }
                const msg = decode$2(data);
                if (msg.type === "Signal") {
                    if (signalCb) {
                        const decodedMessage = decode$2(msg.data);
                        // Note: holochain currently returns signals as an array of two values: cellId and the serialized signal payload
                        // and this array is nested within the App key within the returned message.
                        const decodedCellId = decodedMessage.App[0];
                        // Note:In order to return readible content to the UI, the signal payload must also be decoded.
                        const decodedPayload = signalTransform$1(decodedMessage.App[1]);
                        // Return a uniform format to UI (ie: { type, data } - the same format as with callZome and appInfo...)
                        const signal = {
                            type: msg.type,
                            data: { cellId: decodedCellId, payload: decodedPayload },
                        };
                        signalCb(signal);
                    }
                    else {
                        if (!this.alreadyWarnedNoSignalCb)
                            console.log(`Received signal but no signal callback was set in constructor`);
                        this.alreadyWarnedNoSignalCb = true;
                    }
                }
                else if (msg.type === "Response") {
                    this.handleResponse(msg);
                }
                else {
                    console.error(`Got unrecognized Websocket message type: ${msg.type}`);
                }
            });
        }
        emitSignal(data) {
            const encodedMsg = encode$2({
                type: "Signal",
                data: encode$2(data),
            });
            this.socket.send(encodedMsg);
        }
        request(data) {
            let id = this.index;
            this.index += 1;
            const encodedMsg = encode$2({
                id,
                type: "Request",
                data: encode$2(data),
            });
            const promise = new Promise((fulfill, reject) => {
                this.pendingRequests[id] = { fulfill, reject };
            });
            if (this.socket.readyState === this.socket.OPEN) {
                this.socket.send(encodedMsg);
            }
            else {
                return Promise.reject(new Error(`Socket is not open`));
            }
            return promise;
        }
        handleResponse(msg) {
            const id = msg.id;
            if (this.pendingRequests[id]) {
                // resolve response
                if (msg.data === null || msg.data === undefined) {
                    this.pendingRequests[id].reject(new Error(`Response canceled by responder`));
                }
                else {
                    this.pendingRequests[id].fulfill(decode$2(msg.data));
                }
            }
            else {
                console.error(`Got response with no matching request. id=${id}`);
            }
        }
        close() {
            this.socket.close();
            return this.awaitClose();
        }
        awaitClose() {
            return new Promise((resolve) => this.socket.on("close", resolve));
        }
        static connect(url, signalCb) {
            return new Promise((resolve, reject) => {
                const socket = new browser(url);
                // make sure that there are no uncaught connection
                // errors because that causes nodejs thread to crash
                // with uncaught exception
                socket.onerror = (e) => {
                    reject(new Error(`could not connect to holochain conductor, please check that a conductor service is running and available at ${url}`));
                };
                socket.onopen = () => {
                    resolve(new WsClient$1(socket, signalCb));
                };
            });
        }
    }
    const signalTransform$1 = (res) => {
        return decode$2(res);
    };

    const ERROR_TYPE$1 = 'error';
    const DEFAULT_TIMEOUT$1 = 15000;
    const catchError$1 = (res) => {
        return res.type === ERROR_TYPE$1
            ? Promise.reject(res)
            : Promise.resolve(res);
    };
    const promiseTimeout$1 = (promise, tag, ms) => {
        let id;
        let timeout = new Promise((resolve, reject) => {
            id = setTimeout(() => {
                clearTimeout(id);
                reject(new Error(`Timed out in ${ms}ms: ${tag}`));
            }, ms);
        });
        return new Promise((res, rej) => {
            Promise.race([
                promise,
                timeout
            ]).then((a) => {
                clearTimeout(id);
                return res(a);
            })
                .catch(e => {
                return rej(e);
            });
        });
    };

    var __awaiter$5 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    /**
     * Take a Requester function which deals with tagged requests and responses,
     * and return a Requester which deals only with the inner data types, also
     * with the optional Transformer applied to further modify the input and output.
     */
    const requesterTransformer$1 = (requester, tag, transform = identityTransformer$1) => ((req, timeout) => __awaiter$5(void 0, void 0, void 0, function* () {
        const input = { type: tag, data: transform.input(req) };
        const response = yield requester(input, timeout);
        const output = transform.output(response.data);
        return output;
    }));
    const identity$2 = x => x;
    const identityTransformer$1 = {
        input: identity$2,
        output: identity$2,
    };

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
    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    var __awaiter$4 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    class AppWebsocket$1 {
        constructor(client, defaultTimeout) {
            this._requester = (tag, transformer) => requesterTransformer$1((req, timeout) => promiseTimeout$1(this.client.request(req), tag, timeout || this.defaultTimeout).then(catchError$1), tag, transformer);
            this.appInfo = this._requester('app_info');
            this.callZome = this._requester('zome_call_invocation', callZomeTransform$1);
            this.client = client;
            this.defaultTimeout = defaultTimeout === undefined ? DEFAULT_TIMEOUT$1 : defaultTimeout;
        }
        static connect(url, defaultTimeout, signalCb) {
            return __awaiter$4(this, void 0, void 0, function* () {
                const wsClient = yield WsClient$1.connect(url, signalCb);
                return new AppWebsocket$1(wsClient, defaultTimeout);
            });
        }
    }
    const callZomeTransform$1 = {
        input: (req) => {
            return Object.assign(Object.assign({}, req), { payload: encode$2(req.payload) });
        },
        output: (res) => {
            return decode$2(res);
        }
    };

    /**
      postmate - A powerful, simple, promise-based postMessage library
      @version v1.5.2
      @link https://github.com/dollarshaveclub/postmate
      @author Jacob Kelley <jakie8@gmail.com>
      @license MIT
    **/
    /**
     * The type of messages our frames our sending
     * @type {String}
     */
    var messageType = 'application/x-postmate-v1+json';
    /**
     * The maximum number of attempts to send a handshake request to the parent
     * @type {Number}
     */

    var maxHandshakeRequests = 5;
    /**
     * A unique message ID that is used to ensure responses are sent to the correct requests
     * @type {Number}
     */

    var _messageId = 0;
    /**
     * Increments and returns a message ID
     * @return {Number} A unique ID for a message
     */

    var generateNewMessageId = function generateNewMessageId() {
      return ++_messageId;
    };
    /**
     * Postmate logging function that enables/disables via config
     * @param  {Object} ...args Rest Arguments
     */

    var log = function log() {
      var _console;

      return Postmate.debug ? (_console = console).log.apply(_console, arguments) : null;
    }; // eslint-disable-line no-console

    /**
     * Takes a URL and returns the origin
     * @param  {String} url The full URL being requested
     * @return {String}     The URLs origin
     */

    var resolveOrigin = function resolveOrigin(url) {
      var a = document.createElement('a');
      a.href = url;
      var protocol = a.protocol.length > 4 ? a.protocol : window.location.protocol;
      var host = a.host.length ? a.port === '80' || a.port === '443' ? a.hostname : a.host : window.location.host;
      return a.origin || protocol + "//" + host;
    };
    var messageTypes = {
      handshake: 1,
      'handshake-reply': 1,
      call: 1,
      emit: 1,
      reply: 1,
      request: 1
      /**
       * Ensures that a message is safe to interpret
       * @param  {Object} message The postmate message being sent
       * @param  {String|Boolean} allowedOrigin The whitelisted origin or false to skip origin check
       * @return {Boolean}
       */

    };
    var sanitize = function sanitize(message, allowedOrigin) {
      if (typeof allowedOrigin === 'string' && message.origin !== allowedOrigin) return false;
      if (!message.data) return false;
      if (typeof message.data === 'object' && !('postmate' in message.data)) return false;
      if (message.data.type !== messageType) return false;
      if (!messageTypes[message.data.postmate]) return false;
      return true;
    };
    /**
     * Takes a model, and searches for a value by the property
     * @param  {Object} model     The dictionary to search against
     * @param  {String} property  A path within a dictionary (i.e. 'window.location.href')
     * @param  {Object} data      Additional information from the get request that is
     *                            passed to functions in the child model
     * @return {Promise}
     */

    var resolveValue = function resolveValue(model, property) {
      var unwrappedContext = typeof model[property] === 'function' ? model[property]() : model[property];
      return Postmate.Promise.resolve(unwrappedContext);
    };
    /**
     * Composes an API to be used by the parent
     * @param {Object} info Information on the consumer
     */

    var ParentAPI =
    /*#__PURE__*/
    function () {
      function ParentAPI(info) {
        var _this = this;

        this.parent = info.parent;
        this.frame = info.frame;
        this.child = info.child;
        this.childOrigin = info.childOrigin;
        this.events = {};

        {
          log('Parent: Registering API');
          log('Parent: Awaiting messages...');
        }

        this.listener = function (e) {
          if (!sanitize(e, _this.childOrigin)) return false;
          /**
           * the assignments below ensures that e, data, and value are all defined
           */

          var _ref = ((e || {}).data || {}).value || {},
              data = _ref.data,
              name = _ref.name;

          if (e.data.postmate === 'emit') {
            {
              log("Parent: Received event emission: " + name);
            }

            if (name in _this.events) {
              _this.events[name].call(_this, data);
            }
          }
        };

        this.parent.addEventListener('message', this.listener, false);

        {
          log('Parent: Awaiting event emissions from Child');
        }
      }

      var _proto = ParentAPI.prototype;

      _proto.get = function get(property) {
        var _this2 = this;

        return new Postmate.Promise(function (resolve) {
          // Extract data from response and kill listeners
          var uid = generateNewMessageId();

          var transact = function transact(e) {
            if (e.data.uid === uid && e.data.postmate === 'reply') {
              _this2.parent.removeEventListener('message', transact, false);

              resolve(e.data.value);
            }
          }; // Prepare for response from Child...


          _this2.parent.addEventListener('message', transact, false); // Then ask child for information


          _this2.child.postMessage({
            postmate: 'request',
            type: messageType,
            property: property,
            uid: uid
          }, _this2.childOrigin);
        });
      };

      _proto.call = function call(property, data) {
        // Send information to the child
        this.child.postMessage({
          postmate: 'call',
          type: messageType,
          property: property,
          data: data
        }, this.childOrigin);
      };

      _proto.on = function on(eventName, callback) {
        this.events[eventName] = callback;
      };

      _proto.destroy = function destroy() {
        {
          log('Parent: Destroying Postmate instance');
        }

        window.removeEventListener('message', this.listener, false);
        this.frame.parentNode.removeChild(this.frame);
      };

      return ParentAPI;
    }();
    /**
     * Composes an API to be used by the child
     * @param {Object} info Information on the consumer
     */

    var ChildAPI =
    /*#__PURE__*/
    function () {
      function ChildAPI(info) {
        var _this3 = this;

        this.model = info.model;
        this.parent = info.parent;
        this.parentOrigin = info.parentOrigin;
        this.child = info.child;

        {
          log('Child: Registering API');
          log('Child: Awaiting messages...');
        }

        this.child.addEventListener('message', function (e) {
          if (!sanitize(e, _this3.parentOrigin)) return;

          {
            log('Child: Received request', e.data);
          }

          var _e$data = e.data,
              property = _e$data.property,
              uid = _e$data.uid,
              data = _e$data.data;

          if (e.data.postmate === 'call') {
            if (property in _this3.model && typeof _this3.model[property] === 'function') {
              _this3.model[property](data);
            }

            return;
          } // Reply to Parent


          resolveValue(_this3.model, property).then(function (value) {
            return e.source.postMessage({
              property: property,
              postmate: 'reply',
              type: messageType,
              uid: uid,
              value: value
            }, e.origin);
          });
        });
      }

      var _proto2 = ChildAPI.prototype;

      _proto2.emit = function emit(name, data) {
        {
          log("Child: Emitting Event \"" + name + "\"", data);
        }

        this.parent.postMessage({
          postmate: 'emit',
          type: messageType,
          value: {
            name: name,
            data: data
          }
        }, this.parentOrigin);
      };

      return ChildAPI;
    }();
    /**
      * The entry point of the Parent.
     * @type {Class}
     */

    var Postmate =
    /*#__PURE__*/
    function () {
      // eslint-disable-line no-undef
      // Internet Explorer craps itself

      /**
       * Sets options related to the Parent
       * @param {Object} object The element to inject the frame into, and the url
       * @return {Promise}
       */
      function Postmate(_ref2) {
        var _ref2$container = _ref2.container,
            container = _ref2$container === void 0 ? typeof container !== 'undefined' ? container : document.body : _ref2$container,
            model = _ref2.model,
            url = _ref2.url,
            name = _ref2.name,
            _ref2$classListArray = _ref2.classListArray,
            classListArray = _ref2$classListArray === void 0 ? [] : _ref2$classListArray;
        // eslint-disable-line no-undef
        this.parent = window;
        this.frame = document.createElement('iframe');
        this.frame.name = name || '';
        this.frame.classList.add.apply(this.frame.classList, classListArray);
        container.appendChild(this.frame);
        this.child = this.frame.contentWindow || this.frame.contentDocument.parentWindow;
        this.model = model || {};
        return this.sendHandshake(url);
      }
      /**
       * Begins the handshake strategy
       * @param  {String} url The URL to send a handshake request to
       * @return {Promise}     Promise that resolves when the handshake is complete
       */


      var _proto3 = Postmate.prototype;

      _proto3.sendHandshake = function sendHandshake(url) {
        var _this4 = this;

        var childOrigin = resolveOrigin(url);
        var attempt = 0;
        var responseInterval;
        return new Postmate.Promise(function (resolve, reject) {
          var reply = function reply(e) {
            if (!sanitize(e, childOrigin)) return false;

            if (e.data.postmate === 'handshake-reply') {
              clearInterval(responseInterval);

              {
                log('Parent: Received handshake reply from Child');
              }

              _this4.parent.removeEventListener('message', reply, false);

              _this4.childOrigin = e.origin;

              {
                log('Parent: Saving Child origin', _this4.childOrigin);
              }

              return resolve(new ParentAPI(_this4));
            } // Might need to remove since parent might be receiving different messages
            // from different hosts


            {
              log('Parent: Invalid handshake reply');
            }

            return reject('Failed handshake');
          };

          _this4.parent.addEventListener('message', reply, false);

          var doSend = function doSend() {
            attempt++;

            {
              log("Parent: Sending handshake attempt " + attempt, {
                childOrigin: childOrigin
              });
            }

            _this4.child.postMessage({
              postmate: 'handshake',
              type: messageType,
              model: _this4.model
            }, childOrigin);

            if (attempt === maxHandshakeRequests) {
              clearInterval(responseInterval);
            }
          };

          var loaded = function loaded() {
            doSend();
            responseInterval = setInterval(doSend, 500);
          };

          if (_this4.frame.attachEvent) {
            _this4.frame.attachEvent('onload', loaded);
          } else {
            _this4.frame.onload = loaded;
          }

          {
            log('Parent: Loading frame', {
              url: url
            });
          }

          _this4.frame.src = url;
        });
      };

      return Postmate;
    }();
    /**
     * The entry point of the Child
     * @type {Class}
     */


    Postmate.debug = false;

    Postmate.Promise = function () {
      try {
        return window ? window.Promise : Promise;
      } catch (e) {
        return null;
      }
    }();

    Postmate.Model =
    /*#__PURE__*/
    function () {
      /**
       * Initializes the child, model, parent, and responds to the Parents handshake
       * @param {Object} model Hash of values, functions, or promises
       * @return {Promise}       The Promise that resolves when the handshake has been received
       */
      function Model(model) {
        this.child = window;
        this.model = model;
        this.parent = this.child.parent;
        return this.sendHandshakeReply();
      }
      /**
       * Responds to a handshake initiated by the Parent
       * @return {Promise} Resolves an object that exposes an API for the Child
       */


      var _proto4 = Model.prototype;

      _proto4.sendHandshakeReply = function sendHandshakeReply() {
        var _this5 = this;

        return new Postmate.Promise(function (resolve, reject) {
          var shake = function shake(e) {
            if (!e.data.postmate) {
              return;
            }

            if (e.data.postmate === 'handshake') {
              {
                log('Child: Received handshake from Parent');
              }

              _this5.child.removeEventListener('message', shake, false);

              {
                log('Child: Sending handshake reply to Parent');
              }

              e.source.postMessage({
                postmate: 'handshake-reply',
                type: messageType
              }, e.origin);
              _this5.parentOrigin = e.origin; // Extend model with the one provided by the parent

              var defaults = e.data.model;

              if (defaults) {
                Object.keys(defaults).forEach(function (key) {
                  _this5.model[key] = defaults[key];
                });

                {
                  log('Child: Inherited and extended model from Parent');
                }
              }

              {
                log('Child: Saving Parent origin', _this5.parentOrigin);
              }

              return resolve(new ChildAPI(_this5));
            }

            return reject('Handshake Reply Failed');
          };

          _this5.child.addEventListener('message', shake, false);
        });
      };

      return Model;
    }();

    var postmate_es = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Postmate
    });

    var async_with_timeout_1 = createCommonjsModule(function (module, exports) {
    var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
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
    exports.__esModule = true;
    var TimeoutError = /** @class */ (function (_super) {
        __extends(TimeoutError, _super);
        function TimeoutError(message, timeout) {
            var params = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                params[_i - 2] = arguments[_i];
            }
            var _this = 
            // Pass remaining arguments (including vendor specific ones) to parent constructor
            _super.call(this, message) || this;
            // Maintains proper stack trace for where our error was thrown (only available on V8)
            if (Error.captureStackTrace) {
                Error.captureStackTrace(_this, TimeoutError);
            }
            _this.name = 'TimeoutError';
            _this.timeout = timeout;
            return _this;
        }
        return TimeoutError;
    }(Error));
    exports.TimeoutError = TimeoutError;
    function async_with_timeout(fn, timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = 2000; }
        return new Promise(function (f, r) { return __awaiter(_this, void 0, void 0, function () {
            var to_id, result, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        to_id = setTimeout(function () {
                            r(new TimeoutError("Waited for " + (timeout / 1000) + " seconds", timeout));
                        }, timeout);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, fn()];
                    case 2:
                        result = _a.sent();
                        f(result);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        r(err_1);
                        return [3 /*break*/, 5];
                    case 4:
                        clearTimeout(to_id);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    }
    exports["default"] = async_with_timeout;
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(postmate_es);

    var build = createCommonjsModule(function (module, exports) {
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
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
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    exports.__esModule = true;
    var postmate_1 = __importDefault(require$$0);
    var async_with_timeout_1$1 = __importDefault(async_with_timeout_1);
    var async_with_timeout_2 = async_with_timeout_1;
    /**
     * @module COMB
     *
     * @description
     * Parent window
     * ```html
     * <script type="text/javascript" src="./holo_hosting_comb.js"></script>
     * <script type="text/javascript">
     * (async () => {
     *     const child = await comb.connect( url );
     *
     *     await child.set("mode", mode );
     *
     *     let response = await child.run("signIn");
     * })();
     * </script>
     * ```
     *
     * Child frame
     * ```html
     * <script type="text/javascript" src="./holo_hosting_comb.js"></script>
     * <script type="text/javascript">
     * (async () => {
     *     const parent = comb.listen({
     *         "signIn": async function ( ...args ) {
     *             if ( this.mode === DEVELOP )
     *                 ...
     *             else
     *                 ...
     *             return response;
     *         },
     *     });
     * })();
     * </script>
     * ```
     *
     */
    var COMB = {
        /**
         * Turn on debugging and set the logging level.  If 'debug' is not called, the default log level
         * is 'error'.
         *
         * @function debug
         *
         * @param {string} level		- Log level (default: "debug", options: "error", "warn", "info", "debug", "trace")
         *
         * @example
         * COMB.debug( "info" );
         */
        debug: function (level) {
            postmate_1["default"].debug = true;
        },
        /**
         * Insert an iframe (pointing at the given URL) into the `document.body` and wait for COMB to
         * connect.
         *
         * @async
         * @function connect
         *
         * @param {string} url		- URL that is used as 'src' for the iframe
         *
         * @return {ChildAPI} Connection to child frame
         *
         * @example
         * const child = await COMB.connect( "http://localhost:8002" );
         */
        connect: function (url, timeout, signalCb) {
            return __awaiter(this, void 0, void 0, function () {
                var child;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            child = new ChildAPI(url, timeout, signalCb);
                            return [4 /*yield*/, child.connect()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, child];
                    }
                });
            });
        },
        /**
         * Listen to 'postMessage' requests and wait for a parent window to connect.
         *
         * @async
         * @function listen
         *
         * @param {object} methods		- Functions that are available for the parent to call.
         *
         * @return {ParentAPI} Connection to parent window
         *
         * @example
         * const parent = await COMB.listen({
         *     "hello": async function () {
         *         return "Hello world";
         *     }
         * });
         */
        listen: function (methods) {
            return __awaiter(this, void 0, void 0, function () {
                var parent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            parent = new ParentAPI(methods);
                            return [4 /*yield*/, parent.connect()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, parent];
                    }
                });
            });
        }
    };
    exports.COMB = COMB;
    var ChildAPI = /** @class */ (function () {
        /**
         * Initialize a child frame using the given URL.
         *
         * @class ChildAPI
         *
         * @param {string} url - URL that is used as 'src' for the iframe
         *
         * @prop {string} url         - iFrame URL
         * @prop {number} msg_count   - Incrementing message ID
         * @prop {object} responses   - Dictionary of request Promises waiting for their responses
         * @prop {object} msg_bus     - Postmate instance
         * @prop {promise} handshake  - Promise that is waiting for connection confirmation
         * @prop {string} class_name  - iFrame's unique class name
         * @prop {boolean} loaded     - Indicates if iFrame successfully loaded
         * @prop {any} signalCb       - A callback that's run when we receive a signal
         *
         * @example
         * const child = new ChildAPI( url );
         * await child.connect();
         *
         * await child.set("mode", mode );
         * let response = await child.run("signIn");
         */
        function ChildAPI(url, timeout, signalCb) {
            var _this = this;
            if (timeout === void 0) { timeout = 5000; }
            this.url = url;
            this.msg_count = 0;
            this.responses = {};
            this.loaded = false;
            this.signalCb = signalCb;
            this.class_name = "comb-frame-" + ChildAPI.frame_count++;
            this.handshake = async_with_timeout_1$1["default"](function () { return __awaiter(_this, void 0, void 0, function () {
                var handshake, iframe;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            handshake = new postmate_1["default"]({
                                "container": document.body,
                                "url": this.url,
                                "classListArray": [this.class_name]
                            });
                            iframe = document.querySelector('iframe.' + this.class_name);
                            // log.debug("Listening for iFrame load event", iframe );
                            iframe['contentWindow'].addEventListener("domcontentloaded", function () {
                                // log.debug("iFrame content has loaded");
                                _this.loaded = true;
                            });
                            return [4 /*yield*/, handshake];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); }, timeout);
        }
        /**
         * Wait for handshake to complete and then attach response listener.
         *
         * @async
         *
         * @return {this}
         *
         * @example
         * const child = new ChildAPI( url );
         * await child.connect();
         */
        ChildAPI.prototype.connect = function () {
            return __awaiter(this, void 0, void 0, function () {
                var child, err_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.handshake];
                        case 1:
                            child = _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            if (err_1.name === "TimeoutError") {
                                if (this.loaded) {
                                    // log.error("iFrame loaded but could not communicate with COMB");
                                    throw new async_with_timeout_2.TimeoutError("Failed to complete COMB handshake", err_1.timeout);
                                }
                                else {
                                    // log.error("iFrame did not trigger load event");
                                    throw new async_with_timeout_2.TimeoutError("Failed to load iFrame", err_1.timeout);
                                }
                            }
                            else
                                throw err_1;
                        case 3:
                            // log.info("Finished handshake");
                            child.on('response', function (data) {
                                var k = data[0], v = data[1];
                                // log.info("Received response for msg_id:", k );
                                var _a = _this.responses[k], f = _a[0], r = _a[1];
                                if (v instanceof Error)
                                    r(v);
                                else
                                    f(v);
                                delete _this.responses[k];
                            });
                            if (this.signalCb) {
                                child.on('signal', this.signalCb);
                            }
                            this.msg_bus = child;
                            return [2 /*return*/, this];
                    }
                });
            });
        };
        /**
         * Internal method that wraps requests in a timeout.
         *
         * @async
         * @private
         *
         * @param {string} method   - Internally consistent Postmate method
         * @param {string} name     - Function name or property name
         * @param {*} data          - Variable input that is handled by child API
         *
         * @return {*} Response from child
         */
        ChildAPI.prototype.request = function (method, name, data, timeout) {
            var _this = this;
            if (timeout === void 0) { timeout = 2000; }
            var msg_id = this.msg_count++;
            this.msg_bus.call(method, [msg_id, name, data]);
            // log.info("Sent request with msg_id:", msg_id );
            return async_with_timeout_1$1["default"](function () { return __awaiter(_this, void 0, void 0, function () {
                var request;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            request = new Promise(function (f, r) {
                                _this.responses[msg_id] = [f, r];
                            });
                            return [4 /*yield*/, request];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); }, timeout);
        };
        /**
         * Set a property on the child instance and wait for the confirmation. Properties set that way
         * can be accessed as properties of `this` in the functions passed via listen() to the parentAPI.
         *
         * Essentially, it is a shortcut to remember some state instead of having to write a method to
         * remember some state.  Example `child.set("development_mode", true)` vs
         * `child.call("setDevelopmentMode", true)`.  The latter requires you to define
         * `setDevelopmentMode` on the child model where the former does not require any
         * pre-configuration.
         *
         * @async
         *
         * @param {string} key  - Property name
         * @param {*} value     - Property value
         *
         * @return {boolean} Success status
         *
         * @example
         * let success = await child.set( "key", "value" );
         */
        ChildAPI.prototype.set = function (key, value) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.request("prop", key, value)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Call an exposed function on the child instance and wait for the response.
         *
         * @async
         *
         * @param {string} method		- Name of exposed function to call
         * @param {...*} args		- Arguments that are passed to function
         *
         * @return {*}
         *
         * @example
         * let response = await child.run( "some_method", "argument 1", 2, 3 );
         */
        ChildAPI.prototype.run = function (method) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.request("exec", method, args)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        ChildAPI.prototype.call = function (method) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.request("exec", method, args, 84000000)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        ChildAPI.frame_count = 0;
        return ChildAPI;
    }());
    var ParentAPI = /** @class */ (function () {
        /**
         * Initialize a listening instance and set available methods.
         *
         * @class ParentAPI
         *
         * @param {object} methods    - Functions that are available for the parent to call.
         * @param {object} properties - Properties to memorize in the instance for later use, optional
         *
         * @prop {promise} listener   - Promise that is waiting for parent to connect
         * @prop {object} msg_bus     - Postmate instance
         * @prop {object} methods     - Method storage
         * @prop {object} properties  - Set properties storage
         *
         * @example
         * const parent = new ParentAPI({
         *     "hello": async function () {
         *         return "Hello world";
         *     }
         * });
         * await parent.connect();
         */
        function ParentAPI(methods, properties) {
            var _this = this;
            if (properties === void 0) { properties = {}; }
            this.methods = methods;
            this.properties = properties;
            this.listener = new postmate_1["default"].Model({
                "exec": function (data) { return __awaiter(_this, void 0, void 0, function () {
                    var msg_id, method, args, fn, resp;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                msg_id = data[0], method = data[1], args = data[2];
                                fn = this.methods[method];
                                if (fn === undefined) {
                                    // log.error("Method does not exist", method );
                                    return [2 /*return*/, this.msg_bus.emit("response", [msg_id, new Error("Method '" + method + "' does not exist")])];
                                }
                                if (typeof fn !== "function") {
                                    // log.error("Method is not a function: type", typeof fn );
                                    return [2 /*return*/, this.msg_bus.emit("response", [msg_id, new Error("Method '" + method + "' is not a function. Found type '" + typeof fn + "'")])];
                                }
                                return [4 /*yield*/, fn.apply(this.properties, args)];
                            case 1:
                                resp = _a.sent();
                                this.msg_bus.emit("response", [msg_id, resp]);
                                return [2 /*return*/];
                        }
                    });
                }); },
                "prop": function (data) { return __awaiter(_this, void 0, void 0, function () {
                    var msg_id, key, value;
                    return __generator(this, function (_a) {
                        msg_id = data[0], key = data[1], value = data[2];
                        this.properties[key] = value;
                        this.msg_bus.emit("response", [msg_id, true]);
                        return [2 /*return*/];
                    });
                }); }
            });
        }
        /**
         * Wait for parent to connect.
         *
         * @async
         *
         * @return {this}
         *
         * @example
         * const parent = new ParentAPI({
         *     "hello": async function () {
         *         return "Hello world";
         *     }
         * });
         * await parent.connect();
         */
        ParentAPI.prototype.connect = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this;
                            return [4 /*yield*/, this.listener];
                        case 1:
                            _a.msg_bus = _b.sent();
                            return [2 /*return*/, this];
                    }
                });
            });
        };
        /**
       * Send holochain conductor signal to parent.
       *
       * @async
       *
       * @param {object} signal		- The signal
       *
       * @example
       * const parent = new ParentAPI({
       *     "hello": async function () {
       *         return "Hello world";
       *     }
       * });
       * await parent.sendSignal(signal);
       */
        ParentAPI.prototype.sendSignal = function (signal) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.msg_bus.emit('signal', signal);
                    return [2 /*return*/];
                });
            });
        };
        return ParentAPI;
    }());
    });

    var domain;

    // This constructor is used to store event handlers. Instantiating this is
    // faster than explicitly calling `Object.create(null)` to get a "clean" empty
    // object (tested with v8 v4.9).
    function EventHandlers() {}
    EventHandlers.prototype = Object.create(null);

    function EventEmitter$1() {
      EventEmitter$1.init.call(this);
    }

    // nodejs oddity
    // require('events') === require('events').EventEmitter
    EventEmitter$1.EventEmitter = EventEmitter$1;

    EventEmitter$1.usingDomains = false;

    EventEmitter$1.prototype.domain = undefined;
    EventEmitter$1.prototype._events = undefined;
    EventEmitter$1.prototype._maxListeners = undefined;

    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    EventEmitter$1.defaultMaxListeners = 10;

    EventEmitter$1.init = function() {
      this.domain = null;
      if (EventEmitter$1.usingDomains) {
        // if there is an active domain, then attach to it.
        if (domain.active ) ;
      }

      if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
        this._events = new EventHandlers();
        this._eventsCount = 0;
      }

      this._maxListeners = this._maxListeners || undefined;
    };

    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter$1.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== 'number' || n < 0 || isNaN(n))
        throw new TypeError('"n" argument must be a positive number');
      this._maxListeners = n;
      return this;
    };

    function $getMaxListeners(that) {
      if (that._maxListeners === undefined)
        return EventEmitter$1.defaultMaxListeners;
      return that._maxListeners;
    }

    EventEmitter$1.prototype.getMaxListeners = function getMaxListeners() {
      return $getMaxListeners(this);
    };

    // These standalone emit* functions are used to optimize calling of event
    // handlers for fast cases because emit() itself often has a variable number of
    // arguments and can be deoptimized because of that. These functions always have
    // the same number of arguments and thus do not get deoptimized, so the code
    // inside them can execute faster.
    function emitNone(handler, isFn, self) {
      if (isFn)
        handler.call(self);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self);
      }
    }
    function emitOne(handler, isFn, self, arg1) {
      if (isFn)
        handler.call(self, arg1);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1);
      }
    }
    function emitTwo(handler, isFn, self, arg1, arg2) {
      if (isFn)
        handler.call(self, arg1, arg2);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2);
      }
    }
    function emitThree(handler, isFn, self, arg1, arg2, arg3) {
      if (isFn)
        handler.call(self, arg1, arg2, arg3);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2, arg3);
      }
    }

    function emitMany(handler, isFn, self, args) {
      if (isFn)
        handler.apply(self, args);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].apply(self, args);
      }
    }

    EventEmitter$1.prototype.emit = function emit(type) {
      var er, handler, len, args, i, events, domain;
      var doError = (type === 'error');

      events = this._events;
      if (events)
        doError = (doError && events.error == null);
      else if (!doError)
        return false;

      domain = this.domain;

      // If there is no 'error' event listener then throw.
      if (doError) {
        er = arguments[1];
        if (domain) {
          if (!er)
            er = new Error('Uncaught, unspecified "error" event');
          er.domainEmitter = this;
          er.domain = domain;
          er.domainThrown = false;
          domain.emit('error', er);
        } else if (er instanceof Error) {
          throw er; // Unhandled 'error' event
        } else {
          // At least give some kind of context to the user
          var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
          err.context = er;
          throw err;
        }
        return false;
      }

      handler = events[type];

      if (!handler)
        return false;

      var isFn = typeof handler === 'function';
      len = arguments.length;
      switch (len) {
        // fast cases
        case 1:
          emitNone(handler, isFn, this);
          break;
        case 2:
          emitOne(handler, isFn, this, arguments[1]);
          break;
        case 3:
          emitTwo(handler, isFn, this, arguments[1], arguments[2]);
          break;
        case 4:
          emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
          break;
        // slower
        default:
          args = new Array(len - 1);
          for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];
          emitMany(handler, isFn, this, args);
      }

      return true;
    };

    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = target._events;
      if (!events) {
        events = target._events = new EventHandlers();
        target._eventsCount = 0;
      } else {
        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener) {
          target.emit('newListener', type,
                      listener.listener ? listener.listener : listener);

          // Re-assign `events` because a newListener handler could have caused the
          // this._events to be assigned to a new object
          events = target._events;
        }
        existing = events[type];
      }

      if (!existing) {
        // Optimize the case of one listener. Don't need the extra array object.
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === 'function') {
          // Adding the second element, need to change to array.
          existing = events[type] = prepend ? [listener, existing] :
                                              [existing, listener];
        } else {
          // If we've already got an array, just append.
          if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
        }

        // Check for listener leak
        if (!existing.warned) {
          m = $getMaxListeners(target);
          if (m && m > 0 && existing.length > m) {
            existing.warned = true;
            var w = new Error('Possible EventEmitter memory leak detected. ' +
                                existing.length + ' ' + type + ' listeners added. ' +
                                'Use emitter.setMaxListeners() to increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            emitWarning(w);
          }
        }
      }

      return target;
    }
    function emitWarning(e) {
      typeof console.warn === 'function' ? console.warn(e) : console.log(e);
    }
    EventEmitter$1.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };

    EventEmitter$1.prototype.on = EventEmitter$1.prototype.addListener;

    EventEmitter$1.prototype.prependListener =
        function prependListener(type, listener) {
          return _addListener(this, type, listener, true);
        };

    function _onceWrap(target, type, listener) {
      var fired = false;
      function g() {
        target.removeListener(type, g);
        if (!fired) {
          fired = true;
          listener.apply(target, arguments);
        }
      }
      g.listener = listener;
      return g;
    }

    EventEmitter$1.prototype.once = function once(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };

    EventEmitter$1.prototype.prependOnceListener =
        function prependOnceListener(type, listener) {
          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');
          this.prependListener(type, _onceWrap(this, type, listener));
          return this;
        };

    // emits a 'removeListener' event iff the listener was removed
    EventEmitter$1.prototype.removeListener =
        function removeListener(type, listener) {
          var list, events, position, i, originalListener;

          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');

          events = this._events;
          if (!events)
            return this;

          list = events[type];
          if (!list)
            return this;

          if (list === listener || (list.listener && list.listener === listener)) {
            if (--this._eventsCount === 0)
              this._events = new EventHandlers();
            else {
              delete events[type];
              if (events.removeListener)
                this.emit('removeListener', type, list.listener || listener);
            }
          } else if (typeof list !== 'function') {
            position = -1;

            for (i = list.length; i-- > 0;) {
              if (list[i] === listener ||
                  (list[i].listener && list[i].listener === listener)) {
                originalListener = list[i].listener;
                position = i;
                break;
              }
            }

            if (position < 0)
              return this;

            if (list.length === 1) {
              list[0] = undefined;
              if (--this._eventsCount === 0) {
                this._events = new EventHandlers();
                return this;
              } else {
                delete events[type];
              }
            } else {
              spliceOne(list, position);
            }

            if (events.removeListener)
              this.emit('removeListener', type, originalListener || listener);
          }

          return this;
        };

    EventEmitter$1.prototype.removeAllListeners =
        function removeAllListeners(type) {
          var listeners, events;

          events = this._events;
          if (!events)
            return this;

          // not listening for removeListener, no need to emit
          if (!events.removeListener) {
            if (arguments.length === 0) {
              this._events = new EventHandlers();
              this._eventsCount = 0;
            } else if (events[type]) {
              if (--this._eventsCount === 0)
                this._events = new EventHandlers();
              else
                delete events[type];
            }
            return this;
          }

          // emit removeListener for all listeners on all events
          if (arguments.length === 0) {
            var keys = Object.keys(events);
            for (var i = 0, key; i < keys.length; ++i) {
              key = keys[i];
              if (key === 'removeListener') continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = new EventHandlers();
            this._eventsCount = 0;
            return this;
          }

          listeners = events[type];

          if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
          } else if (listeners) {
            // LIFO order
            do {
              this.removeListener(type, listeners[listeners.length - 1]);
            } while (listeners[0]);
          }

          return this;
        };

    EventEmitter$1.prototype.listeners = function listeners(type) {
      var evlistener;
      var ret;
      var events = this._events;

      if (!events)
        ret = [];
      else {
        evlistener = events[type];
        if (!evlistener)
          ret = [];
        else if (typeof evlistener === 'function')
          ret = [evlistener.listener || evlistener];
        else
          ret = unwrapListeners(evlistener);
      }

      return ret;
    };

    EventEmitter$1.listenerCount = function(emitter, type) {
      if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };

    EventEmitter$1.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;

      if (events) {
        var evlistener = events[type];

        if (typeof evlistener === 'function') {
          return 1;
        } else if (evlistener) {
          return evlistener.length;
        }
      }

      return 0;
    }

    EventEmitter$1.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
    };

    // About 1.5x faster than the two-arg version of Array#splice().
    function spliceOne(list, index) {
      for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
        list[i] = list[k];
      list.pop();
    }

    function arrayClone(arr, i) {
      var copy = new Array(i);
      while (i--)
        copy[i] = arr[i];
      return copy;
    }

    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }

    var events = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': EventEmitter$1,
        EventEmitter: EventEmitter$1
    });

    var require$$1 = /*@__PURE__*/getAugmentedNamespace(events);

    const TESTING = commonjsGlobal.COMB !== undefined;

    const COMB = commonjsGlobal.COMB || build.COMB;

    const { EventEmitter } = require$$1;

    function makeUrlAbsolute (url) {
      return new URL(url, window.location).href
    }

    class Connection extends EventEmitter {

      constructor(url, signalCb, branding) {
        super();

        const hostname = window.location.hostname;
        this.chaperone_url = new URL(url || `http://${hostname}:24273`);
        if (branding !== undefined) {
          if (branding.logo_url !== undefined) {
            this.chaperone_url.searchParams.set("logo_url", makeUrlAbsolute(branding.logo_url));
          }
          if (branding.app_name !== undefined) {
            this.chaperone_url.searchParams.set("app_name", branding.app_name);
          }
          if (branding.info_link !== undefined) {
            this.chaperone_url.searchParams.set("info_link", branding.info_link);
          }
          if (branding.publisher_name !== undefined) {
            this.chaperone_url.searchParams.set("publisher_name", branding.publisher_name);
          }
        }

        this.waiting = [];
        this.child = null;
        this.signalCb = signalCb;
        this.connecting = this.connect();
      }

      ready() {
        return new Promise((resolve, reject) => {
          this.connecting.catch(reject);
          this.child !== null
            ? resolve()
            : this.waiting.push(resolve);
        });
      }

      async connect() {
        try {
          this.child = await COMB.connect(this.chaperone_url.href, 5000, this.signalCb);
        } catch (err) {
          if (err.name === "TimeoutError")
            console.log("Chaperone did not load properly. Is it running?");
          throw err;
        }

        let f;
        while (f = this.waiting.shift()) {
          f();
        }

        if (TESTING)
          return;

        // Alerts:
        //   signin		- emitted when the user completes a successful sign-in
        //   signup		- emitted when the user completes a successful sign-up
        //   signout		- emitted when the user competes a successful sign-out
        //   canceled		- emitted when the user purposefully exits sign-in/up
        //   connected		- emitted when the connection is opened
        //   disconnected	- emitted when the connection is closed
        this.child.msg_bus.on("alert", (event, ...args) => {
          this.emit(event);
        });

        this.iframe = document.getElementsByClassName("comb-frame-0")[0];
        this.iframe.setAttribute('allowtransparency', 'true');

        const style = this.iframe.style;
        style.zIndex = "99999999";
        style.width = "100%";
        style.height = "100%";
        style.position = "absolute";
        style.top = "0";
        style.left = "0";
        style.display = "none";
      }

      async context() {
        return Connection.HOSTED_ANONYMOUS;
      }

      async zomeCall(...args) {
        const response = await this.child.call("zomeCall", ...args);
        return response;
      }

      async appInfo(...args) {
        const response = await this.child.call("appInfo", ...args);
        return response;
      }

      async signUp() {
        this.iframe.style.display = "block";
        const result = await this.child.call("signUp");
        this.iframe.style.display = "none";
        return result;
      }

      async signIn() {
        this.iframe.style.display = "block";
        const result = await this.child.call("signIn");
        this.iframe.style.display = "none";
        return result;
      }

      async signOut() {
        return await this.child.run("signOut");
      }

      async holoInfo() {
        return await this.child.run("holoInfo");
      }
    }

    Connection.AUTONOMOUS = 1;
    Connection.HOSTED_ANONYMOUS = 2;
    Connection.HOSTED_AGENT = 3;

    var AppStatusFilter;
    (function (AppStatusFilter) {
        AppStatusFilter["Active"] = "active";
        AppStatusFilter["Inactive"] = "inactive";
    })(AppStatusFilter || (AppStatusFilter = {}));

    var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    /**
     * A Websocket client which can make requests and receive responses,
     * as well as send and receive signals
     *
     * Uses Holochain's websocket WireMessage for communication.
     */
    class WsClient {
        constructor(socket, signalCb) {
            this.socket = socket;
            this.pendingRequests = {};
            this.index = 0;
            // TODO: allow adding signal handlers later
            this.alreadyWarnedNoSignalCb = false;
            socket.onmessage = (encodedMsg) => __awaiter$3(this, void 0, void 0, function* () {
                let data = encodedMsg.data;
                // If data is not a buffer (nodejs), it will be a blob (browser)
                if (typeof Buffer === "undefined" || !Buffer.isBuffer(data)) {
                    data = yield data.arrayBuffer();
                }
                const msg = decode$2(data);
                if (msg.type === "Signal") {
                    if (signalCb) {
                        const decodedMessage = decode$2(msg.data);
                        // Note: holochain currently returns signals as an array of two values: cellId and the serialized signal payload
                        // and this array is nested within the App key within the returned message.
                        const decodedCellId = decodedMessage.App[0];
                        // Note:In order to return readible content to the UI, the signal payload must also be decoded.
                        const decodedPayload = signalTransform(decodedMessage.App[1]);
                        // Return a uniform format to UI (ie: { type, data } - the same format as with callZome and appInfo...)
                        const signal = {
                            type: msg.type,
                            data: { cellId: decodedCellId, payload: decodedPayload },
                        };
                        signalCb(signal);
                    }
                    else {
                        if (!this.alreadyWarnedNoSignalCb)
                            console.log(`Received signal but no signal callback was set in constructor`);
                        this.alreadyWarnedNoSignalCb = true;
                    }
                }
                else if (msg.type === "Response") {
                    this.handleResponse(msg);
                }
                else {
                    console.error(`Got unrecognized Websocket message type: ${msg.type}`);
                }
            });
        }
        emitSignal(data) {
            const encodedMsg = encode$2({
                type: "Signal",
                data: encode$2(data),
            });
            this.socket.send(encodedMsg);
        }
        request(data) {
            let id = this.index;
            this.index += 1;
            const encodedMsg = encode$2({
                id,
                type: "Request",
                data: encode$2(data),
            });
            const promise = new Promise((fulfill, reject) => {
                this.pendingRequests[id] = { fulfill, reject };
            });
            if (this.socket.readyState === this.socket.OPEN) {
                this.socket.send(encodedMsg);
            }
            else {
                return Promise.reject(new Error(`Socket is not open`));
            }
            return promise;
        }
        handleResponse(msg) {
            const id = msg.id;
            if (this.pendingRequests[id]) {
                // resolve response
                if (msg.data === null || msg.data === undefined) {
                    this.pendingRequests[id].reject(new Error(`Response canceled by responder`));
                }
                else {
                    this.pendingRequests[id].fulfill(decode$2(msg.data));
                }
            }
            else {
                console.error(`Got response with no matching request. id=${id}`);
            }
        }
        close() {
            this.socket.close();
            return this.awaitClose();
        }
        awaitClose() {
            return new Promise((resolve) => this.socket.on("close", resolve));
        }
        static connect(url, signalCb) {
            return new Promise((resolve, reject) => {
                const socket = new browser(url);
                // make sure that there are no uncaught connection
                // errors because that causes nodejs thread to crash
                // with uncaught exception
                socket.onerror = (e) => {
                    reject(new Error(`could not connect to holochain conductor, please check that a conductor service is running and available at ${url}`));
                };
                socket.onopen = () => {
                    resolve(new WsClient(socket, signalCb));
                };
            });
        }
    }
    const signalTransform = (res) => {
        return decode$2(res);
    };

    const ERROR_TYPE = 'error';
    const DEFAULT_TIMEOUT = 15000;
    const catchError = (res) => {
        return res.type === ERROR_TYPE
            ? Promise.reject(res)
            : Promise.resolve(res);
    };
    const promiseTimeout = (promise, tag, ms) => {
        let id;
        let timeout = new Promise((resolve, reject) => {
            id = setTimeout(() => {
                clearTimeout(id);
                reject(new Error(`Timed out in ${ms}ms: ${tag}`));
            }, ms);
        });
        return new Promise((res, rej) => {
            Promise.race([
                promise,
                timeout
            ]).then((a) => {
                clearTimeout(id);
                return res(a);
            })
                .catch(e => {
                return rej(e);
            });
        });
    };

    var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    /**
     * Take a Requester function which deals with tagged requests and responses,
     * and return a Requester which deals only with the inner data types, also
     * with the optional Transformer applied to further modify the input and output.
     */
    const requesterTransformer = (requester, tag, transform = identityTransformer) => ((req, timeout) => __awaiter$2(void 0, void 0, void 0, function* () {
        const input = { type: tag, data: transform.input(req) };
        const response = yield requester(input, timeout);
        const output = transform.output(response.data);
        return output;
    }));
    const identity$1 = x => x;
    const identityTransformer = {
        input: identity$1,
        output: identity$1,
    };

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
    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    class AppWebsocket {
        constructor(client, defaultTimeout) {
            this._requester = (tag, transformer) => requesterTransformer((req, timeout) => promiseTimeout(this.client.request(req), tag, timeout || this.defaultTimeout).then(catchError), tag, transformer);
            this.appInfo = this._requester('app_info');
            this.callZome = this._requester('zome_call_invocation', callZomeTransform);
            this.client = client;
            this.defaultTimeout = defaultTimeout === undefined ? DEFAULT_TIMEOUT : defaultTimeout;
        }
        static connect(url, defaultTimeout, signalCb) {
            return __awaiter$1(this, void 0, void 0, function* () {
                const wsClient = yield WsClient.connect(url, signalCb);
                return new AppWebsocket(wsClient, defaultTimeout);
            });
        }
    }
    const callZomeTransform = {
        input: (req) => {
            return Object.assign(Object.assign({}, req), { payload: encode$2(req.payload) });
        },
        output: (res) => {
            return decode$2(res);
        }
    };

    class HolochainClient {
        constructor(appWebsocket, cellData) {
            this.appWebsocket = appWebsocket;
            this.cellData = cellData;
        }
        get cellId() {
            return this.cellData.cell_id;
        }
        callZome(zomeName, fnName, payload) {
            return this.appWebsocket.callZome({
                cap: null,
                cell_id: this.cellId,
                zome_name: zomeName,
                fn_name: fnName,
                payload: payload,
                provenance: this.cellId[1],
            });
        }
        async addSignalHandler(signalHandler) {
            const appWs = await AppWebsocket.connect(this.appWebsocket.client.socket.url, 15000, signalHandler);
            return {
                unsubscribe: () => {
                    appWs.client.close();
                },
            };
        }
    }

    var HeaderType;
    (function (HeaderType) {
        HeaderType["Dna"] = "Dna";
        HeaderType["AgentValidationPkg"] = "AgentValidationPkg";
        HeaderType["InitZomesComplete"] = "InitZomesComplete";
        HeaderType["CreateLink"] = "CreateLink";
        HeaderType["DeleteLink"] = "DeleteLink";
        HeaderType["OpenChain"] = "OpenChain";
        HeaderType["CloseChain"] = "CloseChain";
        HeaderType["Create"] = "Create";
        HeaderType["Update"] = "Update";
        HeaderType["Delete"] = "Delete";
    })(HeaderType || (HeaderType = {}));

    // https://github.com/holochain/holochain/blob/develop/crates/types/src/dht_op.rs
    var DHTOpType;
    (function (DHTOpType) {
        DHTOpType["StoreElement"] = "StoreElement";
        DHTOpType["StoreEntry"] = "StoreEntry";
        DHTOpType["RegisterAgentActivity"] = "RegisterAgentActivity";
        DHTOpType["RegisterUpdatedContent"] = "RegisterUpdatedContent";
        DHTOpType["RegisterUpdatedElement"] = "RegisterUpdatedElement";
        DHTOpType["RegisterDeletedBy"] = "RegisterDeletedBy";
        DHTOpType["RegisterDeletedEntryHeader"] = "RegisterDeletedEntryHeader";
        DHTOpType["RegisterAddLink"] = "RegisterAddLink";
        DHTOpType["RegisterRemoveLink"] = "RegisterRemoveLink";
    })(DHTOpType || (DHTOpType = {}));
    [
        DHTOpType.RegisterAgentActivity,
        DHTOpType.StoreEntry,
        DHTOpType.StoreElement,
        DHTOpType.RegisterUpdatedContent,
        DHTOpType.RegisterUpdatedElement,
        DHTOpType.RegisterDeletedEntryHeader,
        DHTOpType.RegisterDeletedBy,
        DHTOpType.RegisterAddLink,
        DHTOpType.RegisterRemoveLink,
    ];

    var DetailsType;
    (function (DetailsType) {
        DetailsType[DetailsType["Entry"] = 0] = "Entry";
        DetailsType[DetailsType["Element"] = 1] = "Element";
    })(DetailsType || (DetailsType = {}));

    var ChainStatus;
    (function (ChainStatus) {
        ChainStatus[ChainStatus["Empty"] = 0] = "Empty";
        ChainStatus[ChainStatus["Valid"] = 1] = "Valid";
        ChainStatus[ChainStatus["Forked"] = 2] = "Forked";
        ChainStatus[ChainStatus["Invalid"] = 3] = "Invalid";
    })(ChainStatus || (ChainStatus = {}));
    var EntryDhtStatus;
    (function (EntryDhtStatus) {
        EntryDhtStatus[EntryDhtStatus["Live"] = 0] = "Live";
        /// This [Entry] has no headers that have not been deleted
        EntryDhtStatus[EntryDhtStatus["Dead"] = 1] = "Dead";
        /// This [Entry] is awaiting validation
        EntryDhtStatus[EntryDhtStatus["Pending"] = 2] = "Pending";
        /// This [Entry] has failed validation and will not be served by the DHT
        EntryDhtStatus[EntryDhtStatus["Rejected"] = 3] = "Rejected";
        /// This [Entry] has taken too long / too many resources to validate, so we gave up
        EntryDhtStatus[EntryDhtStatus["Abandoned"] = 4] = "Abandoned";
        /// **not implemented** There has been a conflict when validating this [Entry]
        EntryDhtStatus[EntryDhtStatus["Conflict"] = 5] = "Conflict";
        /// **not implemented** The author has withdrawn their publication of this element.
        EntryDhtStatus[EntryDhtStatus["Withdrawn"] = 6] = "Withdrawn";
        /// **not implemented** We have agreed to drop this [Entry] content from the system. Header can stay with no entry
        EntryDhtStatus[EntryDhtStatus["Purged"] = 7] = "Purged";
    })(EntryDhtStatus || (EntryDhtStatus = {}));

    /**
     *  base64.ts
     *
     *  Licensed under the BSD 3-Clause License.
     *    http://opensource.org/licenses/BSD-3-Clause
     *
     *  References:
     *    http://en.wikipedia.org/wiki/Base64
     *
     * @author Dan Kogai (https://github.com/dankogai)
     */
    const version = '3.6.1';
    /**
     * @deprecated use lowercase `version`.
     */
    const VERSION = version;
    const _hasatob = typeof atob === 'function';
    const _hasbtoa = typeof btoa === 'function';
    const _hasBuffer = typeof Buffer === 'function';
    const _TD = typeof TextDecoder === 'function' ? new TextDecoder() : undefined;
    const _TE = typeof TextEncoder === 'function' ? new TextEncoder() : undefined;
    const b64ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const b64chs = [...b64ch];
    const b64tab = ((a) => {
        let tab = {};
        a.forEach((c, i) => tab[c] = i);
        return tab;
    })(b64chs);
    const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
    const _fromCC = String.fromCharCode.bind(String);
    const _U8Afrom = typeof Uint8Array.from === 'function'
        ? Uint8Array.from.bind(Uint8Array)
        : (it, fn = (x) => x) => new Uint8Array(Array.prototype.slice.call(it, 0).map(fn));
    const _mkUriSafe = (src) => src
        .replace(/[+\/]/g, (m0) => m0 == '+' ? '-' : '_')
        .replace(/=+$/m, '');
    const _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, '');
    /**
     * polyfill version of `btoa`
     */
    const btoaPolyfill = (bin) => {
        // console.log('polyfilled');
        let u32, c0, c1, c2, asc = '';
        const pad = bin.length % 3;
        for (let i = 0; i < bin.length;) {
            if ((c0 = bin.charCodeAt(i++)) > 255 ||
                (c1 = bin.charCodeAt(i++)) > 255 ||
                (c2 = bin.charCodeAt(i++)) > 255)
                throw new TypeError('invalid character found');
            u32 = (c0 << 16) | (c1 << 8) | c2;
            asc += b64chs[u32 >> 18 & 63]
                + b64chs[u32 >> 12 & 63]
                + b64chs[u32 >> 6 & 63]
                + b64chs[u32 & 63];
        }
        return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
    };
    /**
     * does what `window.btoa` of web browsers do.
     * @param {String} bin binary string
     * @returns {string} Base64-encoded string
     */
    const _btoa = _hasbtoa ? (bin) => btoa(bin)
        : _hasBuffer ? (bin) => Buffer.from(bin, 'binary').toString('base64')
            : btoaPolyfill;
    const _fromUint8Array = _hasBuffer
        ? (u8a) => Buffer.from(u8a).toString('base64')
        : (u8a) => {
            // cf. https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string/12713326#12713326
            const maxargs = 0x1000;
            let strs = [];
            for (let i = 0, l = u8a.length; i < l; i += maxargs) {
                strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
            }
            return _btoa(strs.join(''));
        };
    /**
     * converts a Uint8Array to a Base64 string.
     * @param {boolean} [urlsafe] URL-and-filename-safe a la RFC4648 §5
     * @returns {string} Base64 string
     */
    const fromUint8Array = (u8a, urlsafe = false) => urlsafe ? _mkUriSafe(_fromUint8Array(u8a)) : _fromUint8Array(u8a);
    // This trick is found broken https://github.com/dankogai/js-base64/issues/130
    // const utob = (src: string) => unescape(encodeURIComponent(src));
    // reverting good old fationed regexp
    const cb_utob = (c) => {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (_fromCC(0xc0 | (cc >>> 6))
                    + _fromCC(0x80 | (cc & 0x3f)))
                    : (_fromCC(0xe0 | ((cc >>> 12) & 0x0f))
                        + _fromCC(0x80 | ((cc >>> 6) & 0x3f))
                        + _fromCC(0x80 | (cc & 0x3f)));
        }
        else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (_fromCC(0xf0 | ((cc >>> 18) & 0x07))
                + _fromCC(0x80 | ((cc >>> 12) & 0x3f))
                + _fromCC(0x80 | ((cc >>> 6) & 0x3f))
                + _fromCC(0x80 | (cc & 0x3f)));
        }
    };
    const re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    /**
     * @deprecated should have been internal use only.
     * @param {string} src UTF-8 string
     * @returns {string} UTF-16 string
     */
    const utob = (u) => u.replace(re_utob, cb_utob);
    //
    const _encode = _hasBuffer
        ? (s) => Buffer.from(s, 'utf8').toString('base64')
        : _TE
            ? (s) => _fromUint8Array(_TE.encode(s))
            : (s) => _btoa(utob(s));
    /**
     * converts a UTF-8-encoded string to a Base64 string.
     * @param {boolean} [urlsafe] if `true` make the result URL-safe
     * @returns {string} Base64 string
     */
    const encode$1 = (src, urlsafe = false) => urlsafe
        ? _mkUriSafe(_encode(src))
        : _encode(src);
    /**
     * converts a UTF-8-encoded string to URL-safe Base64 RFC4648 §5.
     * @returns {string} Base64 string
     */
    const encodeURI = (src) => encode$1(src, true);
    // This trick is found broken https://github.com/dankogai/js-base64/issues/130
    // const btou = (src: string) => decodeURIComponent(escape(src));
    // reverting good old fationed regexp
    const re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
    const cb_btou = (cccc) => {
        switch (cccc.length) {
            case 4:
                var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                    | ((0x3f & cccc.charCodeAt(1)) << 12)
                    | ((0x3f & cccc.charCodeAt(2)) << 6)
                    | (0x3f & cccc.charCodeAt(3)), offset = cp - 0x10000;
                return (_fromCC((offset >>> 10) + 0xD800)
                    + _fromCC((offset & 0x3FF) + 0xDC00));
            case 3:
                return _fromCC(((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    | (0x3f & cccc.charCodeAt(2)));
            default:
                return _fromCC(((0x1f & cccc.charCodeAt(0)) << 6)
                    | (0x3f & cccc.charCodeAt(1)));
        }
    };
    /**
     * @deprecated should have been internal use only.
     * @param {string} src UTF-16 string
     * @returns {string} UTF-8 string
     */
    const btou = (b) => b.replace(re_btou, cb_btou);
    /**
     * polyfill version of `atob`
     */
    const atobPolyfill = (asc) => {
        // console.log('polyfilled');
        asc = asc.replace(/\s+/g, '');
        if (!b64re.test(asc))
            throw new TypeError('malformed base64.');
        asc += '=='.slice(2 - (asc.length & 3));
        let u24, bin = '', r1, r2;
        for (let i = 0; i < asc.length;) {
            u24 = b64tab[asc.charAt(i++)] << 18
                | b64tab[asc.charAt(i++)] << 12
                | (r1 = b64tab[asc.charAt(i++)]) << 6
                | (r2 = b64tab[asc.charAt(i++)]);
            bin += r1 === 64 ? _fromCC(u24 >> 16 & 255)
                : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255)
                    : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);
        }
        return bin;
    };
    /**
     * does what `window.atob` of web browsers do.
     * @param {String} asc Base64-encoded string
     * @returns {string} binary string
     */
    const _atob = _hasatob ? (asc) => atob(_tidyB64(asc))
        : _hasBuffer ? (asc) => Buffer.from(asc, 'base64').toString('binary')
            : atobPolyfill;
    //
    const _toUint8Array = _hasBuffer
        ? (a) => _U8Afrom(Buffer.from(a, 'base64'))
        : (a) => _U8Afrom(_atob(a), c => c.charCodeAt(0));
    /**
     * converts a Base64 string to a Uint8Array.
     */
    const toUint8Array = (a) => _toUint8Array(_unURI(a));
    //
    const _decode = _hasBuffer
        ? (a) => Buffer.from(a, 'base64').toString('utf8')
        : _TD
            ? (a) => _TD.decode(_toUint8Array(a))
            : (a) => btou(_atob(a));
    const _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == '-' ? '+' : '/'));
    /**
     * converts a Base64 string to a UTF-8 string.
     * @param {String} src Base64 string.  Both normal and URL-safe are supported
     * @returns {string} UTF-8 string
     */
    const decode$1 = (src) => _decode(_unURI(src));
    /**
     * check if a value is a valid Base64 string
     * @param {String} src a value to check
      */
    const isValid = (src) => {
        if (typeof src !== 'string')
            return false;
        const s = src.replace(/\s+/g, '').replace(/=+$/, '');
        return !/[^\s0-9a-zA-Z\+/]/.test(s) || !/[^\s0-9a-zA-Z\-_]/.test(s);
    };
    //
    const _noEnum = (v) => {
        return {
            value: v, enumerable: false, writable: true, configurable: true
        };
    };
    /**
     * extend String.prototype with relevant methods
     */
    const extendString = function () {
        const _add = (name, body) => Object.defineProperty(String.prototype, name, _noEnum(body));
        _add('fromBase64', function () { return decode$1(this); });
        _add('toBase64', function (urlsafe) { return encode$1(this, urlsafe); });
        _add('toBase64URI', function () { return encode$1(this, true); });
        _add('toBase64URL', function () { return encode$1(this, true); });
        _add('toUint8Array', function () { return toUint8Array(this); });
    };
    /**
     * extend Uint8Array.prototype with relevant methods
     */
    const extendUint8Array = function () {
        const _add = (name, body) => Object.defineProperty(Uint8Array.prototype, name, _noEnum(body));
        _add('toBase64', function (urlsafe) { return fromUint8Array(this, urlsafe); });
        _add('toBase64URI', function () { return fromUint8Array(this, true); });
        _add('toBase64URL', function () { return fromUint8Array(this, true); });
    };
    /**
     * extend Builtin prototypes with relevant methods
     */
    const extendBuiltins = () => {
        extendString();
        extendUint8Array();
    };
    const gBase64 = {
        version: version,
        VERSION: VERSION,
        atob: _atob,
        atobPolyfill: atobPolyfill,
        btoa: _btoa,
        btoaPolyfill: btoaPolyfill,
        fromBase64: decode$1,
        toBase64: encode$1,
        encode: encode$1,
        encodeURI: encodeURI,
        encodeURL: encodeURI,
        utob: utob,
        btou: btou,
        decode: decode$1,
        isValid: isValid,
        fromUint8Array: fromUint8Array,
        toUint8Array: toUint8Array,
        extendString: extendString,
        extendUint8Array: extendUint8Array,
        extendBuiltins: extendBuiltins,
    };

    function serializeHash(hash) {
        return `u${gBase64.fromUint8Array(hash, true)}`;
    }

    var ValidationStatus;
    (function (ValidationStatus) {
        ValidationStatus[ValidationStatus["Valid"] = 0] = "Valid";
        ValidationStatus[ValidationStatus["Rejected"] = 1] = "Rejected";
        ValidationStatus[ValidationStatus["Abandoned"] = 2] = "Abandoned";
    })(ValidationStatus || (ValidationStatus = {}));

    // Integer Utility
    var UINT32_MAX = 4294967295;
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

    var TEXT_ENCODING_AVAILABLE = (typeof process === "undefined" || process.env["TEXT_ENCODING"] !== "never") &&
        typeof TextEncoder !== "undefined" &&
        typeof TextDecoder !== "undefined";
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
        ? UINT32_MAX
        : typeof process !== "undefined" && process.env["TEXT_ENCODING"] !== "force"
            ? 200
            : 0;
    function utf8EncodeTEencode(str, output, outputOffset) {
        output.set(sharedTextEncoder.encode(str), outputOffset);
    }
    function utf8EncodeTEencodeInto(str, output, outputOffset) {
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
        ? UINT32_MAX
        : typeof process !== "undefined" && process.env["TEXT_DECODER"] !== "force"
            ? 200
            : 0;
    function utf8DecodeTD(bytes, inputOffset, byteLength) {
        var stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
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

    var __extends = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            if (typeof b !== "function" && b !== null)
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var DecodeError = /** @class */ (function (_super) {
        __extends(DecodeError, _super);
        function DecodeError(message) {
            var _this = _super.call(this, message) || this;
            // fix the prototype chain in a cross-platform way
            var proto = Object.create(DecodeError.prototype);
            Object.setPrototypeOf(_this, proto);
            Object.defineProperty(_this, "name", {
                configurable: true,
                enumerable: false,
                value: DecodeError.name,
            });
            return _this;
        }
        return DecodeError;
    }(Error));

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
                throw new DecodeError("Unrecognized data size for timestamp (expected 4, 8, or 12): " + data.length);
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
                var encodeExt = this.builtInEncoders[i];
                if (encodeExt != null) {
                    var data = encodeExt(object, context);
                    if (data != null) {
                        var type = -1 - i;
                        return new ExtData(type, data);
                    }
                }
            }
            // custom extensions
            for (var i = 0; i < this.encoders.length; i++) {
                var encodeExt = this.encoders[i];
                if (encodeExt != null) {
                    var data = encodeExt(object, context);
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
            var decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
            if (decodeExt) {
                return decodeExt(data, type, context);
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
                        // negative fixint
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
            // avoid `new Array(N)`, which makes a sparse array,
            // because a sparse array is typically slower than a non-sparse array.
            this.caches = [];
            for (var i = 0; i < this.maxKeyLength; i++) {
                this.caches.push([]);
            }
        }
        CachedKeyDecoder.prototype.canBeCached = function (byteLength) {
            return byteLength > 0 && byteLength <= this.maxKeyLength;
        };
        CachedKeyDecoder.prototype.find = function (bytes, inputOffset, byteLength) {
            var records = this.caches[byteLength - 1];
            FIND_CHUNK: for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
                var record = records_1[_i];
                var recordBytes = record.bytes;
                for (var j = 0; j < byteLength; j++) {
                    if (recordBytes[j] !== bytes[inputOffset + j]) {
                        continue FIND_CHUNK;
                    }
                }
                return record.str;
            }
            return null;
        };
        CachedKeyDecoder.prototype.store = function (bytes, value) {
            var records = this.caches[bytes.length - 1];
            var record = { bytes: bytes, str: value };
            if (records.length >= this.maxLengthPerKey) {
                // `records` are full!
                // Set `record` to an arbitrary position.
                records[(Math.random() * records.length) | 0] = record;
            }
            else {
                records.push(record);
            }
        };
        CachedKeyDecoder.prototype.decode = function (bytes, inputOffset, byteLength) {
            var cachedValue = this.find(bytes, inputOffset, byteLength);
            if (cachedValue != null) {
                this.hit++;
                return cachedValue;
            }
            this.miss++;
            var str = utf8DecodeJs(bytes, inputOffset, byteLength);
            // Ensure to copy a slice of bytes because the byte may be NodeJS Buffer and Buffer#slice() returns a reference to its internal ArrayBuffer.
            var slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
            this.store(slicedCopyOfBytes, str);
            return str;
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
    var sharedCachedKeyDecoder = new CachedKeyDecoder();
    var Decoder = /** @class */ (function () {
        function Decoder(extensionCodec, context, maxStrLength, maxBinLength, maxArrayLength, maxMapLength, maxExtLength, keyDecoder) {
            if (extensionCodec === void 0) { extensionCodec = ExtensionCodec.defaultCodec; }
            if (context === void 0) { context = undefined; }
            if (maxStrLength === void 0) { maxStrLength = UINT32_MAX; }
            if (maxBinLength === void 0) { maxBinLength = UINT32_MAX; }
            if (maxArrayLength === void 0) { maxArrayLength = UINT32_MAX; }
            if (maxMapLength === void 0) { maxMapLength = UINT32_MAX; }
            if (maxExtLength === void 0) { maxExtLength = UINT32_MAX; }
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
            this.stack.length = 0;
            // view, bytes, and pos will be re-initialized in setBuffer()
        };
        Decoder.prototype.setBuffer = function (buffer) {
            this.bytes = ensureUint8Array(buffer);
            this.view = createDataView(this.bytes);
            this.pos = 0;
        };
        Decoder.prototype.appendBuffer = function (buffer) {
            if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
                this.setBuffer(buffer);
            }
            else {
                var remainingData = this.bytes.subarray(this.pos);
                var newData = ensureUint8Array(buffer);
                // concat remainingData + newData
                var newBuffer = new Uint8Array(remainingData.length + newData.length);
                newBuffer.set(remainingData);
                newBuffer.set(newData, remainingData.length);
                this.setBuffer(newBuffer);
            }
        };
        Decoder.prototype.hasRemaining = function (size) {
            return this.view.byteLength - this.pos >= size;
        };
        Decoder.prototype.createExtraByteError = function (posToShow) {
            var _a = this, view = _a.view, pos = _a.pos;
            return new RangeError("Extra " + (view.byteLength - pos) + " of " + view.byteLength + " byte(s) found at buffer[" + posToShow + "]");
        };
        /**
         * @throws {DecodeError}
         * @throws {RangeError}
         */
        Decoder.prototype.decode = function (buffer) {
            this.reinitializeState();
            this.setBuffer(buffer);
            var object = this.doDecodeSync();
            if (this.hasRemaining(1)) {
                throw this.createExtraByteError(this.pos);
            }
            return object;
        };
        Decoder.prototype.decodeMulti = function (buffer) {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.reinitializeState();
                        this.setBuffer(buffer);
                        _a.label = 1;
                    case 1:
                        if (!this.hasRemaining(1)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.doDecodeSync()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
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
                                if (this.hasRemaining(1)) {
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
                    throw new DecodeError("Unrecognized type byte: " + prettyByte(headByte));
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
                            throw new DecodeError("The type of key must be string or number but " + typeof object);
                        }
                        if (object === "__proto__") {
                            throw new DecodeError("The key __proto__ is not allowed");
                        }
                        state.key = object;
                        state.type = 2 /* MAP_VALUE */;
                        continue DECODE;
                    }
                    else {
                        // it must be `state.type === State.MAP_VALUE` here
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
                        throw new DecodeError("Unrecognized array type byte: " + prettyByte(headByte));
                    }
                }
            }
        };
        Decoder.prototype.pushMapState = function (size) {
            if (size > this.maxMapLength) {
                throw new DecodeError("Max length exceeded: map length (" + size + ") > maxMapLengthLength (" + this.maxMapLength + ")");
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
                throw new DecodeError("Max length exceeded: array length (" + size + ") > maxArrayLength (" + this.maxArrayLength + ")");
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
                throw new DecodeError("Max length exceeded: UTF-8 byte length (" + byteLength + ") > maxStrLength (" + this.maxStrLength + ")");
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
                throw new DecodeError("Max length exceeded: bin length (" + byteLength + ") > maxBinLength (" + this.maxBinLength + ")");
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
                throw new DecodeError("Max length exceeded: ext length (" + size + ") > maxExtLength (" + this.maxExtLength + ")");
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
     * It decodes a single MessagePack object in a buffer.
     *
     * This is a synchronous decoding function.
     * See other variants for asynchronous decoding: {@link decodeAsync()}, {@link decodeStream()}, or {@link decodeArrayStream()}.
     */
    function decode(buffer, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        var decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
        return decoder.decode(buffer);
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

    var freeGlobal$1 = freeGlobal;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal$1 || freeSelf || Function('return this')();

    var root$1 = root;

    /** Built-in value references. */
    var Symbol$1 = root$1.Symbol;

    var Symbol$2 = Symbol$1;

    /** Used for built-in method references. */
    var objectProto$f = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$c = objectProto$f.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString$1 = objectProto$f.toString;

    /** Built-in value references. */
    var symToStringTag$1 = Symbol$2 ? Symbol$2.toStringTag : undefined;

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty$c.call(value, symToStringTag$1),
          tag = value[symToStringTag$1];

      try {
        value[symToStringTag$1] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString$1.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag$1] = tag;
        } else {
          delete value[symToStringTag$1];
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$e = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto$e.toString;

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }

    /** `Object#toString` result references. */
    var nullTag = '[object Null]',
        undefinedTag = '[object Undefined]';

    /** Built-in value references. */
    var symToStringTag = Symbol$2 ? Symbol$2.toStringTag : undefined;

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag && symToStringTag in Object(value))
        ? getRawTag(value)
        : objectToString(value);
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    var isArray$1 = isArray;

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    /**
     * This method returns the first argument it receives.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'a': 1 };
     *
     * console.log(_.identity(object) === object);
     * // => true
     */
    function identity(value) {
      return value;
    }

    /** `Object#toString` result references. */
    var asyncTag = '[object AsyncFunction]',
        funcTag$2 = '[object Function]',
        genTag$1 = '[object GeneratorFunction]',
        proxyTag = '[object Proxy]';

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 9 which returns 'object' for typed arrays and other constructors.
      var tag = baseGetTag(value);
      return tag == funcTag$2 || tag == genTag$1 || tag == asyncTag || tag == proxyTag;
    }

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root$1['__core-js_shared__'];

    var coreJsData$1 = coreJsData;

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /** Used for built-in method references. */
    var funcProto$2 = Function.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$2 = funcProto$2.toString;

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString$2.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var funcProto$1 = Function.prototype,
        objectProto$d = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = funcProto$1.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$b = objectProto$d.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString$1.call(hasOwnProperty$b).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /* Built-in method references that are verified to be native. */
    var WeakMap$1 = getNative(root$1, 'WeakMap');

    var WeakMap$2 = WeakMap$1;

    /** Built-in value references. */
    var objectCreate = Object.create;

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} proto The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(proto) {
        if (!isObject(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object;
        object.prototype = undefined;
        return result;
      };
    }());

    var baseCreate$1 = baseCreate;

    /**
     * A faster alternative to `Function#apply`, this function invokes `func`
     * with the `this` binding of `thisArg` and the arguments of `args`.
     *
     * @private
     * @param {Function} func The function to invoke.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} args The arguments to invoke `func` with.
     * @returns {*} Returns the result of `func`.
     */
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0: return func.call(thisArg);
        case 1: return func.call(thisArg, args[0]);
        case 2: return func.call(thisArg, args[0], args[1]);
        case 3: return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /** Used to detect hot functions by number of calls within a span of milliseconds. */
    var HOT_COUNT = 800,
        HOT_SPAN = 16;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeNow = Date.now;

    /**
     * Creates a function that'll short out and invoke `identity` instead
     * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
     * milliseconds.
     *
     * @private
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new shortable function.
     */
    function shortOut(func) {
      var count = 0,
          lastCalled = 0;

      return function() {
        var stamp = nativeNow(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count = 0;
        }
        return func.apply(undefined, arguments);
      };
    }

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Util
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new constant function.
     * @example
     *
     * var objects = _.times(2, _.constant({ 'a': 1 }));
     *
     * console.log(objects);
     * // => [{ 'a': 1 }, { 'a': 1 }]
     *
     * console.log(objects[0] === objects[1]);
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    var defineProperty = (function() {
      try {
        var func = getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
      } catch (e) {}
    }());

    var defineProperty$1 = defineProperty;

    /**
     * The base implementation of `setToString` without support for hot loop shorting.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var baseSetToString = !defineProperty$1 ? identity : function(func, string) {
      return defineProperty$1(func, 'toString', {
        'configurable': true,
        'enumerable': false,
        'value': constant(string),
        'writable': true
      });
    };

    var baseSetToString$1 = baseSetToString;

    /**
     * Sets the `toString` method of `func` to return `string`.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var setToString = shortOut(baseSetToString$1);

    var setToString$1 = setToString;

    /**
     * A specialized version of `_.forEach` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array == null ? 0 : array.length;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$1 = 9007199254740991;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER$1 : length;

      return !!length &&
        (type == 'number' ||
          (type != 'symbol' && reIsUint.test(value))) &&
            (value > -1 && value % 1 == 0 && value < length);
    }

    /**
     * The base implementation of `assignValue` and `assignMergeValue` without
     * value checks.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function baseAssignValue(object, key, value) {
      if (key == '__proto__' && defineProperty$1) {
        defineProperty$1(object, key, {
          'configurable': true,
          'enumerable': true,
          'value': value,
          'writable': true
        });
      } else {
        object[key] = value;
      }
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /** Used for built-in method references. */
    var objectProto$c = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$a = objectProto$c.hasOwnProperty;

    /**
     * Assigns `value` to `key` of `object` if the existing value is not equivalent
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty$a.call(object, key) && eq(objValue, value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property identifiers to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @param {Function} [customizer] The function to customize copied values.
     * @returns {Object} Returns `object`.
     */
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];

        var newValue = customizer
          ? customizer(object[key], source[key], key, object, source)
          : undefined;

        if (newValue === undefined) {
          newValue = source[key];
        }
        if (isNew) {
          baseAssignValue(object, key, newValue);
        } else {
          assignValue(object, key, newValue);
        }
      }
      return object;
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max;

    /**
     * A specialized version of `baseRest` which transforms the rest array.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @param {Function} transform The rest array transform.
     * @returns {Function} Returns the new function.
     */
    function overRest(func, start, transform) {
      start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
      };
    }

    /**
     * The base implementation of `_.rest` which doesn't validate or coerce arguments.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     */
    function baseRest(func, start) {
      return setToString$1(overRest(func, start, identity), func + '');
    }

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * Checks if the given arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
     *  else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
            ? (isArrayLike(object) && isIndex(index, object.length))
            : (type == 'string' && index in object)
          ) {
        return eq(object[index], value);
      }
      return false;
    }

    /**
     * Creates a function like `_.assign`.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @returns {Function} Returns the new assigner function.
     */
    function createAssigner(assigner) {
      return baseRest(function(object, sources) {
        var index = -1,
            length = sources.length,
            customizer = length > 1 ? sources[length - 1] : undefined,
            guard = length > 2 ? sources[2] : undefined;

        customizer = (assigner.length > 3 && typeof customizer == 'function')
          ? (length--, customizer)
          : undefined;

        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? undefined : customizer;
          length = 1;
        }
        object = Object(object);
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, index, customizer);
          }
        }
        return object;
      });
    }

    /** Used for built-in method references. */
    var objectProto$b = Object.prototype;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$b;

      return value === proto;
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
          result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /** `Object#toString` result references. */
    var argsTag$3 = '[object Arguments]';

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag$3;
    }

    /** Used for built-in method references. */
    var objectProto$a = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$9 = objectProto$a.hasOwnProperty;

    /** Built-in value references. */
    var propertyIsEnumerable$1 = objectProto$a.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty$9.call(value, 'callee') &&
        !propertyIsEnumerable$1.call(value, 'callee');
    };

    var isArguments$1 = isArguments;

    /**
     * This method returns `false`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `false`.
     * @example
     *
     * _.times(2, _.stubFalse);
     * // => [false, false]
     */
    function stubFalse() {
      return false;
    }

    /** Detect free variable `exports`. */
    var freeExports$2 = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule$2 = freeExports$2 && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

    /** Built-in value references. */
    var Buffer$2 = moduleExports$2 ? root$1.Buffer : undefined;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeIsBuffer = Buffer$2 ? Buffer$2.isBuffer : undefined;

    /**
     * Checks if `value` is a buffer.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
     * @example
     *
     * _.isBuffer(new Buffer(2));
     * // => true
     *
     * _.isBuffer(new Uint8Array(2));
     * // => false
     */
    var isBuffer = nativeIsBuffer || stubFalse;

    var isBuffer$1 = isBuffer;

    /** `Object#toString` result references. */
    var argsTag$2 = '[object Arguments]',
        arrayTag$2 = '[object Array]',
        boolTag$3 = '[object Boolean]',
        dateTag$3 = '[object Date]',
        errorTag$2 = '[object Error]',
        funcTag$1 = '[object Function]',
        mapTag$5 = '[object Map]',
        numberTag$3 = '[object Number]',
        objectTag$4 = '[object Object]',
        regexpTag$3 = '[object RegExp]',
        setTag$5 = '[object Set]',
        stringTag$3 = '[object String]',
        weakMapTag$2 = '[object WeakMap]';

    var arrayBufferTag$3 = '[object ArrayBuffer]',
        dataViewTag$4 = '[object DataView]',
        float32Tag$2 = '[object Float32Array]',
        float64Tag$2 = '[object Float64Array]',
        int8Tag$2 = '[object Int8Array]',
        int16Tag$2 = '[object Int16Array]',
        int32Tag$2 = '[object Int32Array]',
        uint8Tag$2 = '[object Uint8Array]',
        uint8ClampedTag$2 = '[object Uint8ClampedArray]',
        uint16Tag$2 = '[object Uint16Array]',
        uint32Tag$2 = '[object Uint32Array]';

    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag$2] = typedArrayTags[float64Tag$2] =
    typedArrayTags[int8Tag$2] = typedArrayTags[int16Tag$2] =
    typedArrayTags[int32Tag$2] = typedArrayTags[uint8Tag$2] =
    typedArrayTags[uint8ClampedTag$2] = typedArrayTags[uint16Tag$2] =
    typedArrayTags[uint32Tag$2] = true;
    typedArrayTags[argsTag$2] = typedArrayTags[arrayTag$2] =
    typedArrayTags[arrayBufferTag$3] = typedArrayTags[boolTag$3] =
    typedArrayTags[dataViewTag$4] = typedArrayTags[dateTag$3] =
    typedArrayTags[errorTag$2] = typedArrayTags[funcTag$1] =
    typedArrayTags[mapTag$5] = typedArrayTags[numberTag$3] =
    typedArrayTags[objectTag$4] = typedArrayTags[regexpTag$3] =
    typedArrayTags[setTag$5] = typedArrayTags[stringTag$3] =
    typedArrayTags[weakMapTag$2] = false;

    /**
     * The base implementation of `_.isTypedArray` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     */
    function baseIsTypedArray(value) {
      return isObjectLike(value) &&
        isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }

    /**
     * The base implementation of `_.unary` without support for storing metadata.
     *
     * @private
     * @param {Function} func The function to cap arguments for.
     * @returns {Function} Returns the new capped function.
     */
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }

    /** Detect free variable `exports`. */
    var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

    /** Detect free variable `process` from Node.js. */
    var freeProcess = moduleExports$1 && freeGlobal$1.process;

    /** Used to access faster Node.js helpers. */
    var nodeUtil = (function() {
      try {
        // Use `util.types` for Node.js 10+.
        var types = freeModule$1 && freeModule$1.require && freeModule$1.require('util').types;

        if (types) {
          return types;
        }

        // Legacy `process.binding('util')` for Node.js < 10.
        return freeProcess && freeProcess.binding && freeProcess.binding('util');
      } catch (e) {}
    }());

    var nodeUtil$1 = nodeUtil;

    /* Node.js helper references. */
    var nodeIsTypedArray = nodeUtil$1 && nodeUtil$1.isTypedArray;

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

    var isTypedArray$1 = isTypedArray;

    /** Used for built-in method references. */
    var objectProto$9 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$8 = objectProto$9.hasOwnProperty;

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray$1(value),
          isArg = !isArr && isArguments$1(value),
          isBuff = !isArr && !isArg && isBuffer$1(value),
          isType = !isArr && !isArg && !isBuff && isTypedArray$1(value),
          skipIndexes = isArr || isArg || isBuff || isType,
          result = skipIndexes ? baseTimes(value.length, String) : [],
          length = result.length;

      for (var key in value) {
        if ((inherited || hasOwnProperty$8.call(value, key)) &&
            !(skipIndexes && (
               // Safari 9 has enumerable `arguments.length` in strict mode.
               key == 'length' ||
               // Node.js 0.10 has enumerable non-index properties on buffers.
               (isBuff && (key == 'offset' || key == 'parent')) ||
               // PhantomJS 2 has enumerable non-index properties on typed arrays.
               (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
               // Skip index properties.
               isIndex(key, length)
            ))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeKeys = overArg(Object.keys, Object);

    var nativeKeys$1 = nativeKeys;

    /** Used for built-in method references. */
    var objectProto$8 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$7 = objectProto$8.hasOwnProperty;

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys$1(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }

    /**
     * This function is like
     * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * except that it includes inherited enumerable properties.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$7 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

    /**
     * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object),
          result = [];

      for (var key in object) {
        if (!(key == 'constructor' && (isProto || !hasOwnProperty$6.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
    }

    /* Built-in method references that are verified to be native. */
    var nativeCreate = getNative(Object, 'create');

    var nativeCreate$1 = nativeCreate;

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

    /** Used for built-in method references. */
    var objectProto$6 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate$1) {
        var result = data[key];
        return result === HASH_UNDEFINED$2 ? undefined : result;
      }
      return hasOwnProperty$5.call(data, key) ? data[key] : undefined;
    }

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate$1 ? (data[key] !== undefined) : hasOwnProperty$4.call(data, key);
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = (nativeCreate$1 && value === undefined) ? HASH_UNDEFINED$1 : value;
      return this;
    }

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype['delete'] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /** Used for built-in method references. */
    var arrayProto = Array.prototype;

    /** Built-in value references. */
    var splice = arrayProto.splice;

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype['delete'] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /* Built-in method references that are verified to be native. */
    var Map$1 = getNative(root$1, 'Map');

    var Map$2 = Map$1;

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        'hash': new Hash,
        'map': new (Map$2 || ListCache),
        'string': new Hash
      };
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = getMapData(this, key)['delete'](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = getMapData(this, key),
          size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype['delete'] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
          length = values.length,
          offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    /** Built-in value references. */
    var getPrototype = overArg(Object.getPrototypeOf, Object);

    var getPrototype$1 = getPrototype;

    /** `Object#toString` result references. */
    var objectTag$3 = '[object Object]';

    /** Used for built-in method references. */
    var funcProto = Function.prototype,
        objectProto$4 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

    /** Used to infer the `Object` constructor. */
    var objectCtorString = funcToString.call(Object);

    /**
     * Checks if `value` is a plain object, that is, an object created by the
     * `Object` constructor or one with a `[[Prototype]]` of `null`.
     *
     * @static
     * @memberOf _
     * @since 0.8.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * _.isPlainObject(new Foo);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     *
     * _.isPlainObject(Object.create(null));
     * // => true
     */
    function isPlainObject(value) {
      if (!isObjectLike(value) || baseGetTag(value) != objectTag$3) {
        return false;
      }
      var proto = getPrototype$1(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty$3.call(proto, 'constructor') && proto.constructor;
      return typeof Ctor == 'function' && Ctor instanceof Ctor &&
        funcToString.call(Ctor) == objectCtorString;
    }

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new ListCache;
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      var data = this.__data__,
          result = data['delete'](key);

      this.size = data.size;
      return result;
    }

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      return this.__data__.get(key);
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      return this.__data__.has(key);
    }

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map$2 || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype['delete'] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /**
     * The base implementation of `_.assign` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return object && copyObject(source, keys(source), object);
    }

    /**
     * The base implementation of `_.assignIn` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssignIn(object, source) {
      return object && copyObject(source, keysIn(source), object);
    }

    /** Detect free variable `exports`. */
    var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /** Built-in value references. */
    var Buffer$1 = moduleExports ? root$1.Buffer : undefined,
        allocUnsafe = Buffer$1 ? Buffer$1.allocUnsafe : undefined;

    /**
     * Creates a clone of  `buffer`.
     *
     * @private
     * @param {Buffer} buffer The buffer to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Buffer} Returns the cloned buffer.
     */
    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice();
      }
      var length = buffer.length,
          result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

      buffer.copy(result);
      return result;
    }

    /**
     * A specialized version of `_.filter` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function arrayFilter(array, predicate) {
      var index = -1,
          length = array == null ? 0 : array.length,
          resIndex = 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }

    /**
     * This method returns a new empty array.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {Array} Returns the new empty array.
     * @example
     *
     * var arrays = _.times(2, _.stubArray);
     *
     * console.log(arrays);
     * // => [[], []]
     *
     * console.log(arrays[0] === arrays[1]);
     * // => false
     */
    function stubArray() {
      return [];
    }

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

    /**
     * Creates an array of the own enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbols = !nativeGetSymbols$1 ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols$1(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };

    var getSymbols$1 = getSymbols;

    /**
     * Copies own symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbols(source, object) {
      return copyObject(source, getSymbols$1(source), object);
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetSymbols = Object.getOwnPropertySymbols;

    /**
     * Creates an array of the own and inherited enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
      var result = [];
      while (object) {
        arrayPush(result, getSymbols$1(object));
        object = getPrototype$1(object);
      }
      return result;
    };

    var getSymbolsIn$1 = getSymbolsIn;

    /**
     * Copies own and inherited symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbolsIn(source, object) {
      return copyObject(source, getSymbolsIn$1(source), object);
    }

    /**
     * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
     * `keysFunc` and `symbolsFunc` to get the enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @param {Function} symbolsFunc The function to get the symbols of `object`.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray$1(object) ? result : arrayPush(result, symbolsFunc(object));
    }

    /**
     * Creates an array of own enumerable property names and symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols$1);
    }

    /**
     * Creates an array of own and inherited enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeysIn(object) {
      return baseGetAllKeys(object, keysIn, getSymbolsIn$1);
    }

    /* Built-in method references that are verified to be native. */
    var DataView$1 = getNative(root$1, 'DataView');

    var DataView$2 = DataView$1;

    /* Built-in method references that are verified to be native. */
    var Promise$1 = getNative(root$1, 'Promise');

    var Promise$2 = Promise$1;

    /* Built-in method references that are verified to be native. */
    var Set$1 = getNative(root$1, 'Set');

    var Set$2 = Set$1;

    /** `Object#toString` result references. */
    var mapTag$4 = '[object Map]',
        objectTag$2 = '[object Object]',
        promiseTag = '[object Promise]',
        setTag$4 = '[object Set]',
        weakMapTag$1 = '[object WeakMap]';

    var dataViewTag$3 = '[object DataView]';

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = toSource(DataView$2),
        mapCtorString = toSource(Map$2),
        promiseCtorString = toSource(Promise$2),
        setCtorString = toSource(Set$2),
        weakMapCtorString = toSource(WeakMap$2);

    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    var getTag = baseGetTag;

    // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
    if ((DataView$2 && getTag(new DataView$2(new ArrayBuffer(1))) != dataViewTag$3) ||
        (Map$2 && getTag(new Map$2) != mapTag$4) ||
        (Promise$2 && getTag(Promise$2.resolve()) != promiseTag) ||
        (Set$2 && getTag(new Set$2) != setTag$4) ||
        (WeakMap$2 && getTag(new WeakMap$2) != weakMapTag$1)) {
      getTag = function(value) {
        var result = baseGetTag(value),
            Ctor = result == objectTag$2 ? value.constructor : undefined,
            ctorString = Ctor ? toSource(Ctor) : '';

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString: return dataViewTag$3;
            case mapCtorString: return mapTag$4;
            case promiseCtorString: return promiseTag;
            case setCtorString: return setTag$4;
            case weakMapCtorString: return weakMapTag$1;
          }
        }
        return result;
      };
    }

    var getTag$1 = getTag;

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$2.hasOwnProperty;

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty$2.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /** Built-in value references. */
    var Uint8Array$1 = root$1.Uint8Array;

    var Uint8Array$2 = Uint8Array$1;

    /**
     * Creates a clone of `arrayBuffer`.
     *
     * @private
     * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array$2(result).set(new Uint8Array$2(arrayBuffer));
      return result;
    }

    /**
     * Creates a clone of `dataView`.
     *
     * @private
     * @param {Object} dataView The data view to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned data view.
     */
    function cloneDataView(dataView, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
      return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
    }

    /** Used to match `RegExp` flags from their coerced string values. */
    var reFlags = /\w*$/;

    /**
     * Creates a clone of `regexp`.
     *
     * @private
     * @param {Object} regexp The regexp to clone.
     * @returns {Object} Returns the cloned regexp.
     */
    function cloneRegExp(regexp) {
      var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
      result.lastIndex = regexp.lastIndex;
      return result;
    }

    /** Used to convert symbols to primitives and strings. */
    var symbolProto$1 = Symbol$2 ? Symbol$2.prototype : undefined,
        symbolValueOf$1 = symbolProto$1 ? symbolProto$1.valueOf : undefined;

    /**
     * Creates a clone of the `symbol` object.
     *
     * @private
     * @param {Object} symbol The symbol object to clone.
     * @returns {Object} Returns the cloned symbol object.
     */
    function cloneSymbol(symbol) {
      return symbolValueOf$1 ? Object(symbolValueOf$1.call(symbol)) : {};
    }

    /**
     * Creates a clone of `typedArray`.
     *
     * @private
     * @param {Object} typedArray The typed array to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned typed array.
     */
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }

    /** `Object#toString` result references. */
    var boolTag$2 = '[object Boolean]',
        dateTag$2 = '[object Date]',
        mapTag$3 = '[object Map]',
        numberTag$2 = '[object Number]',
        regexpTag$2 = '[object RegExp]',
        setTag$3 = '[object Set]',
        stringTag$2 = '[object String]',
        symbolTag$2 = '[object Symbol]';

    var arrayBufferTag$2 = '[object ArrayBuffer]',
        dataViewTag$2 = '[object DataView]',
        float32Tag$1 = '[object Float32Array]',
        float64Tag$1 = '[object Float64Array]',
        int8Tag$1 = '[object Int8Array]',
        int16Tag$1 = '[object Int16Array]',
        int32Tag$1 = '[object Int32Array]',
        uint8Tag$1 = '[object Uint8Array]',
        uint8ClampedTag$1 = '[object Uint8ClampedArray]',
        uint16Tag$1 = '[object Uint16Array]',
        uint32Tag$1 = '[object Uint32Array]';

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag$2:
          return cloneArrayBuffer(object);

        case boolTag$2:
        case dateTag$2:
          return new Ctor(+object);

        case dataViewTag$2:
          return cloneDataView(object, isDeep);

        case float32Tag$1: case float64Tag$1:
        case int8Tag$1: case int16Tag$1: case int32Tag$1:
        case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
          return cloneTypedArray(object, isDeep);

        case mapTag$3:
          return new Ctor;

        case numberTag$2:
        case stringTag$2:
          return new Ctor(object);

        case regexpTag$2:
          return cloneRegExp(object);

        case setTag$3:
          return new Ctor;

        case symbolTag$2:
          return cloneSymbol(object);
      }
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      return (typeof object.constructor == 'function' && !isPrototype(object))
        ? baseCreate$1(getPrototype$1(object))
        : {};
    }

    /** `Object#toString` result references. */
    var mapTag$2 = '[object Map]';

    /**
     * The base implementation of `_.isMap` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     */
    function baseIsMap(value) {
      return isObjectLike(value) && getTag$1(value) == mapTag$2;
    }

    /* Node.js helper references. */
    var nodeIsMap = nodeUtil$1 && nodeUtil$1.isMap;

    /**
     * Checks if `value` is classified as a `Map` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     * @example
     *
     * _.isMap(new Map);
     * // => true
     *
     * _.isMap(new WeakMap);
     * // => false
     */
    var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

    var isMap$1 = isMap;

    /** `Object#toString` result references. */
    var setTag$2 = '[object Set]';

    /**
     * The base implementation of `_.isSet` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     */
    function baseIsSet(value) {
      return isObjectLike(value) && getTag$1(value) == setTag$2;
    }

    /* Node.js helper references. */
    var nodeIsSet = nodeUtil$1 && nodeUtil$1.isSet;

    /**
     * Checks if `value` is classified as a `Set` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     * @example
     *
     * _.isSet(new Set);
     * // => true
     *
     * _.isSet(new WeakSet);
     * // => false
     */
    var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

    var isSet$1 = isSet;

    /** Used to compose bitmasks for cloning. */
    var CLONE_DEEP_FLAG$1 = 1,
        CLONE_FLAT_FLAG = 2,
        CLONE_SYMBOLS_FLAG$1 = 4;

    /** `Object#toString` result references. */
    var argsTag$1 = '[object Arguments]',
        arrayTag$1 = '[object Array]',
        boolTag$1 = '[object Boolean]',
        dateTag$1 = '[object Date]',
        errorTag$1 = '[object Error]',
        funcTag = '[object Function]',
        genTag = '[object GeneratorFunction]',
        mapTag$1 = '[object Map]',
        numberTag$1 = '[object Number]',
        objectTag$1 = '[object Object]',
        regexpTag$1 = '[object RegExp]',
        setTag$1 = '[object Set]',
        stringTag$1 = '[object String]',
        symbolTag$1 = '[object Symbol]',
        weakMapTag = '[object WeakMap]';

    var arrayBufferTag$1 = '[object ArrayBuffer]',
        dataViewTag$1 = '[object DataView]',
        float32Tag = '[object Float32Array]',
        float64Tag = '[object Float64Array]',
        int8Tag = '[object Int8Array]',
        int16Tag = '[object Int16Array]',
        int32Tag = '[object Int32Array]',
        uint8Tag = '[object Uint8Array]',
        uint8ClampedTag = '[object Uint8ClampedArray]',
        uint16Tag = '[object Uint16Array]',
        uint32Tag = '[object Uint32Array]';

    /** Used to identify `toStringTag` values supported by `_.clone`. */
    var cloneableTags = {};
    cloneableTags[argsTag$1] = cloneableTags[arrayTag$1] =
    cloneableTags[arrayBufferTag$1] = cloneableTags[dataViewTag$1] =
    cloneableTags[boolTag$1] = cloneableTags[dateTag$1] =
    cloneableTags[float32Tag] = cloneableTags[float64Tag] =
    cloneableTags[int8Tag] = cloneableTags[int16Tag] =
    cloneableTags[int32Tag] = cloneableTags[mapTag$1] =
    cloneableTags[numberTag$1] = cloneableTags[objectTag$1] =
    cloneableTags[regexpTag$1] = cloneableTags[setTag$1] =
    cloneableTags[stringTag$1] = cloneableTags[symbolTag$1] =
    cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
    cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
    cloneableTags[errorTag$1] = cloneableTags[funcTag] =
    cloneableTags[weakMapTag] = false;

    /**
     * The base implementation of `_.clone` and `_.cloneDeep` which tracks
     * traversed objects.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Deep clone
     *  2 - Flatten inherited properties
     *  4 - Clone symbols
     * @param {Function} [customizer] The function to customize cloning.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The parent object of `value`.
     * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, bitmask, customizer, key, object, stack) {
      var result,
          isDeep = bitmask & CLONE_DEEP_FLAG$1,
          isFlat = bitmask & CLONE_FLAT_FLAG,
          isFull = bitmask & CLONE_SYMBOLS_FLAG$1;

      if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray$1(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return copyArray(value, result);
        }
      } else {
        var tag = getTag$1(value),
            isFunc = tag == funcTag || tag == genTag;

        if (isBuffer$1(value)) {
          return cloneBuffer(value, isDeep);
        }
        if (tag == objectTag$1 || tag == argsTag$1 || (isFunc && !object)) {
          result = (isFlat || isFunc) ? {} : initCloneObject(value);
          if (!isDeep) {
            return isFlat
              ? copySymbolsIn(value, baseAssignIn(result, value))
              : copySymbols(value, baseAssign(result, value));
          }
        } else {
          if (!cloneableTags[tag]) {
            return object ? value : {};
          }
          result = initCloneByTag(value, tag, isDeep);
        }
      }
      // Check for circular references and return its corresponding clone.
      stack || (stack = new Stack);
      var stacked = stack.get(value);
      if (stacked) {
        return stacked;
      }
      stack.set(value, result);

      if (isSet$1(value)) {
        value.forEach(function(subValue) {
          result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
        });
      } else if (isMap$1(value)) {
        value.forEach(function(subValue, key) {
          result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
        });
      }

      var keysFunc = isFull
        ? (isFlat ? getAllKeysIn : getAllKeys)
        : (isFlat ? keysIn : keys);

      var props = isArr ? undefined : keysFunc(value);
      arrayEach(props || value, function(subValue, key) {
        if (props) {
          key = subValue;
          subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
      });
      return result;
    }

    /** Used to compose bitmasks for cloning. */
    var CLONE_DEEP_FLAG = 1,
        CLONE_SYMBOLS_FLAG = 4;

    /**
     * This method is like `_.clone` except that it recursively clones `value`.
     *
     * @static
     * @memberOf _
     * @since 1.0.0
     * @category Lang
     * @param {*} value The value to recursively clone.
     * @returns {*} Returns the deep cloned value.
     * @see _.clone
     * @example
     *
     * var objects = [{ 'a': 1 }, { 'b': 2 }];
     *
     * var deep = _.cloneDeep(objects);
     * console.log(deep[0] === objects[0]);
     * // => false
     */
    function cloneDeep(value) {
      return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /**
     * Adds `value` to the array cache.
     *
     * @private
     * @name add
     * @memberOf SetCache
     * @alias push
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache instance.
     */
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }

    /**
     * Checks if `value` is in the array cache.
     *
     * @private
     * @name has
     * @memberOf SetCache
     * @param {*} value The value to search for.
     * @returns {number} Returns `true` if `value` is found, else `false`.
     */
    function setCacheHas(value) {
      return this.__data__.has(value);
    }

    /**
     *
     * Creates an array cache object to store unique values.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var index = -1,
          length = values == null ? 0 : values.length;

      this.__data__ = new MapCache;
      while (++index < length) {
        this.add(values[index]);
      }
    }

    // Add methods to `SetCache`.
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;

    /**
     * A specialized version of `_.some` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array == null ? 0 : array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Checks if a `cache` value for `key` exists.
     *
     * @private
     * @param {Object} cache The cache to query.
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function cacheHas(cache, key) {
      return cache.has(key);
    }

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG$3 = 1,
        COMPARE_UNORDERED_FLAG$1 = 2;

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `array` and `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      // Check that cyclic values are equal.
      var arrStacked = stack.get(array);
      var othStacked = stack.get(other);
      if (arrStacked && othStacked) {
        return arrStacked == other && othStacked == array;
      }
      var index = -1,
          result = true,
          seen = (bitmask & COMPARE_UNORDERED_FLAG$1) ? new SetCache : undefined;

      stack.set(array, other);
      stack.set(other, array);

      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, arrValue, index, other, array, stack)
            : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
          if (!arraySome(other, function(othValue, othIndex) {
                if (!cacheHas(seen, othIndex) &&
                    (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                  return seen.push(othIndex);
                }
              })) {
            result = false;
            break;
          }
        } else if (!(
              arrValue === othValue ||
                equalFunc(arrValue, othValue, bitmask, customizer, stack)
            )) {
          result = false;
          break;
        }
      }
      stack['delete'](array);
      stack['delete'](other);
      return result;
    }

    /**
     * Converts `map` to its key-value pairs.
     *
     * @private
     * @param {Object} map The map to convert.
     * @returns {Array} Returns the key-value pairs.
     */
    function mapToArray(map) {
      var index = -1,
          result = Array(map.size);

      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }

    /**
     * Converts `set` to an array of its values.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the values.
     */
    function setToArray(set) {
      var index = -1,
          result = Array(set.size);

      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG$2 = 1,
        COMPARE_UNORDERED_FLAG = 2;

    /** `Object#toString` result references. */
    var boolTag = '[object Boolean]',
        dateTag = '[object Date]',
        errorTag = '[object Error]',
        mapTag = '[object Map]',
        numberTag = '[object Number]',
        regexpTag = '[object RegExp]',
        setTag = '[object Set]',
        stringTag = '[object String]',
        symbolTag = '[object Symbol]';

    var arrayBufferTag = '[object ArrayBuffer]',
        dataViewTag = '[object DataView]';

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = Symbol$2 ? Symbol$2.prototype : undefined,
        symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if ((object.byteLength != other.byteLength) ||
              (object.byteOffset != other.byteOffset)) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;

        case arrayBufferTag:
          if ((object.byteLength != other.byteLength) ||
              !equalFunc(new Uint8Array$2(object), new Uint8Array$2(other))) {
            return false;
          }
          return true;

        case boolTag:
        case dateTag:
        case numberTag:
          // Coerce booleans to `1` or `0` and dates to milliseconds.
          // Invalid dates are coerced to `NaN`.
          return eq(+object, +other);

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings, primitives and objects,
          // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
          // for more details.
          return object == (other + '');

        case mapTag:
          var convert = mapToArray;

        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2;
          convert || (convert = setToArray);

          if (object.size != other.size && !isPartial) {
            return false;
          }
          // Assume cyclic values are equal.
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;

          // Recursively compare objects (susceptible to call stack limits).
          stack.set(object, other);
          var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
          stack['delete'](object);
          return result;

        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG$1 = 1;

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1,
          objProps = getAllKeys(object),
          objLength = objProps.length,
          othProps = getAllKeys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty$1.call(other, key))) {
          return false;
        }
      }
      // Check that cyclic values are equal.
      var objStacked = stack.get(object);
      var othStacked = stack.get(other);
      if (objStacked && othStacked) {
        return objStacked == other && othStacked == object;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);

      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, objValue, key, other, object, stack)
            : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined
              ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
              : compared
            )) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack['delete'](object);
      stack['delete'](other);
      return result;
    }

    /** Used to compose bitmasks for value comparisons. */
    var COMPARE_PARTIAL_FLAG = 1;

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]',
        arrayTag = '[object Array]',
        objectTag = '[object Object]';

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} [stack] Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray$1(object),
          othIsArr = isArray$1(other),
          objTag = objIsArr ? arrayTag : getTag$1(object),
          othTag = othIsArr ? arrayTag : getTag$1(other);

      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;

      var objIsObj = objTag == objectTag,
          othIsObj = othTag == objectTag,
          isSameTag = objTag == othTag;

      if (isSameTag && isBuffer$1(object)) {
        if (!isBuffer$1(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack);
        return (objIsArr || isTypedArray$1(object))
          ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
          : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object,
              othUnwrapped = othIsWrapped ? other.value() : other;

          stack || (stack = new Stack);
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack);
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }

    /**
     * The base implementation of `_.isEqual` which supports partial comparisons
     * and tracks traversed objects.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Unordered comparison
     *  2 - Partial comparison
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {Object} [stack] Tracks traversed `value` and `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }

    /**
     * Creates a base function for methods like `_.forIn` and `_.forOwn`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1,
            iterable = Object(object),
            props = keysFunc(object),
            length = props.length;

        while (length--) {
          var key = props[fromRight ? length : ++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * The base implementation of `baseForOwn` which iterates over `object`
     * properties returned by `keysFunc` and invokes `iteratee` for each property.
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    var baseFor$1 = baseFor;

    /**
     * This function is like `assignValue` except that it doesn't assign
     * `undefined` values.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignMergeValue(object, key, value) {
      if ((value !== undefined && !eq(object[key], value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }

    /**
     * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function safeGet(object, key) {
      if (key === 'constructor' && typeof object[key] === 'function') {
        return;
      }

      if (key == '__proto__') {
        return;
      }

      return object[key];
    }

    /**
     * Converts `value` to a plain object flattening inherited enumerable string
     * keyed properties of `value` to own properties of the plain object.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Object} Returns the converted plain object.
     * @example
     *
     * function Foo() {
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.assign({ 'a': 1 }, new Foo);
     * // => { 'a': 1, 'b': 2 }
     *
     * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
     * // => { 'a': 1, 'b': 2, 'c': 3 }
     */
    function toPlainObject(value) {
      return copyObject(value, keysIn(value));
    }

    /**
     * A specialized version of `baseMerge` for arrays and objects which performs
     * deep merges and tracks traversed objects enabling objects with circular
     * references to be merged.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {string} key The key of the value to merge.
     * @param {number} srcIndex The index of `source`.
     * @param {Function} mergeFunc The function to merge values.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     */
    function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
      var objValue = safeGet(object, key),
          srcValue = safeGet(source, key),
          stacked = stack.get(srcValue);

      if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
      }
      var newValue = customizer
        ? customizer(objValue, srcValue, (key + ''), object, source, stack)
        : undefined;

      var isCommon = newValue === undefined;

      if (isCommon) {
        var isArr = isArray$1(srcValue),
            isBuff = !isArr && isBuffer$1(srcValue),
            isTyped = !isArr && !isBuff && isTypedArray$1(srcValue);

        newValue = srcValue;
        if (isArr || isBuff || isTyped) {
          if (isArray$1(objValue)) {
            newValue = objValue;
          }
          else if (isArrayLikeObject(objValue)) {
            newValue = copyArray(objValue);
          }
          else if (isBuff) {
            isCommon = false;
            newValue = cloneBuffer(srcValue, true);
          }
          else if (isTyped) {
            isCommon = false;
            newValue = cloneTypedArray(srcValue, true);
          }
          else {
            newValue = [];
          }
        }
        else if (isPlainObject(srcValue) || isArguments$1(srcValue)) {
          newValue = objValue;
          if (isArguments$1(objValue)) {
            newValue = toPlainObject(objValue);
          }
          else if (!isObject(objValue) || isFunction(objValue)) {
            newValue = initCloneObject(srcValue);
          }
        }
        else {
          isCommon = false;
        }
      }
      if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack['delete'](srcValue);
      }
      assignMergeValue(object, key, newValue);
    }

    /**
     * The base implementation of `_.merge` without support for multiple sources.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {number} srcIndex The index of `source`.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     */
    function baseMerge(object, source, srcIndex, customizer, stack) {
      if (object === source) {
        return;
      }
      baseFor$1(source, function(srcValue, key) {
        stack || (stack = new Stack);
        if (isObject(srcValue)) {
          baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        }
        else {
          var newValue = customizer
            ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
            : undefined;

          if (newValue === undefined) {
            newValue = srcValue;
          }
          assignMergeValue(object, key, newValue);
        }
      }, keysIn);
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent.
     *
     * **Note:** This method supports comparing arrays, array buffers, booleans,
     * date objects, error objects, maps, numbers, `Object` objects, regexes,
     * sets, strings, symbols, and typed arrays. `Object` objects are compared
     * by their own, not inherited, enumerable properties. Functions and DOM
     * nodes are compared by strict equality, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.isEqual(object, other);
     * // => true
     *
     * object === other;
     * // => false
     */
    function isEqual(value, other) {
      return baseIsEqual(value, other);
    }

    /**
     * This method is like `_.assign` except that it recursively merges own and
     * inherited enumerable string keyed properties of source objects into the
     * destination object. Source properties that resolve to `undefined` are
     * skipped if a destination value exists. Array and plain object properties
     * are merged recursively. Other objects and value types are overridden by
     * assignment. Source objects are applied from left to right. Subsequent
     * sources overwrite property assignments of previous sources.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 0.5.0
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = {
     *   'a': [{ 'b': 2 }, { 'd': 4 }]
     * };
     *
     * var other = {
     *   'a': [{ 'c': 3 }, { 'e': 5 }]
     * };
     *
     * _.merge(object, other);
     * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
     */
    var merge = createAssigner(function(object, source, srcIndex) {
      baseMerge(object, source, srcIndex);
    });

    var merge$1 = merge;

    var SynMessageType;
    (function (SynMessageType) {
        SynMessageType["SyncReq"] = "SyncReq";
        SynMessageType["SyncResp"] = "SyncResp";
        SynMessageType["ChangeReq"] = "ChangeReq";
        SynMessageType["ChangeNotice"] = "ChangeNotice";
        SynMessageType["CommitNotice"] = "CommitNotice";
        SynMessageType["Heartbeat"] = "Heartbeat";
        SynMessageType["FolkLore"] = "FolkLore";
    })(SynMessageType || (SynMessageType = {}));
    const allMessageTypes = [
        SynMessageType.SyncReq,
        SynMessageType.SyncResp,
        SynMessageType.ChangeReq,
        SynMessageType.ChangeNotice,
        SynMessageType.CommitNotice,
        SynMessageType.Heartbeat,
        SynMessageType.FolkLore,
    ];

    function deepDecodeUint8Arrays(object) {
        if (object === undefined || object === null)
            return object;
        if (object instanceof Uint8Array)
            return decode(object);
        if (typeof object !== "object")
            return object;
        if (Array.isArray(object))
            return object.map(deepDecodeUint8Arrays);
        const obj = {};
        for (const key of Object.keys(object)) {
            obj[key] = deepDecodeUint8Arrays(object[key]);
        }
        return obj;
    }

    class SynClient {
        constructor(cellClient, handleSignal, zomeName = "syn") {
            this.cellClient = cellClient;
            this.handleSignal = handleSignal;
            this.zomeName = zomeName;
            this.unsubscribe = () => { };
            cellClient
                .addSignalHandler((signal) => {
                console.log(signal);
                if (isEqual(cellClient.cellId, signal.data.cellId) &&
                    signal.data.payload.message &&
                    allMessageTypes.includes(signal.data.payload.message.type)) {
                    handleSignal(deepDecodeUint8Arrays(signal.data.payload));
                }
            })
                .then(({ unsubscribe }) => (this.unsubscribe = unsubscribe));
        }
        close() {
            return this.unsubscribe();
        }
        /** Content */
        putSnapshot(content) {
            return this.callZome("put_snapshot", encode(content));
        }
        async getSnapshot(snapshotHash) {
            const content = await this.callZome("get_snapshot", snapshotHash);
            return decode(content);
        }
        /** Commits */
        commit(commitInput) {
            const commit = Object.assign(Object.assign({}, commitInput), { commit: Object.assign(Object.assign({}, commitInput.commit), { changes: this.encodeChangeBundle(commitInput.commit.changes) }) });
            return this.callZome("commit", commit);
        }
        /** Hash */
        hashContent(content) {
            return this.callZome("hash_content", encode(content));
        }
        /** Session */
        async getSession(sessionHash) {
            const sessionInfo = await this.callZome("get_session", sessionHash);
            return this.decodeSessionInfo(sessionInfo);
        }
        async newSession(newSessionInput) {
            const sessionInfo = await this.callZome("new_session", newSessionInput);
            return this.decodeSessionInfo(sessionInfo);
        }
        getSessions() {
            return this.callZome("get_sessions", null);
        }
        /** Folks */
        getFolks() {
            return this.callZome("get_folks", null);
        }
        sendFolkLore(sendFolkLoreInput) {
            return this.callZome("send_folk_lore", sendFolkLoreInput);
        }
        /** Sync */
        sendSyncRequest(syncRequestInput) {
            return this.callZome("send_sync_request", syncRequestInput);
        }
        sendSyncResponse(syncResponseInput) {
            const missedCommits = {};
            for (const hash of Object.keys(syncResponseInput.state.missedCommits)) {
                missedCommits[hash] = this.encodeCommit(syncResponseInput.state.missedCommits[hash]);
            }
            const input = Object.assign(Object.assign({}, syncResponseInput), { state: Object.assign(Object.assign({}, syncResponseInput.state), { missedCommits, uncommittedChanges: this.encodeChangeBundle(syncResponseInput.state.uncommittedChanges) }) });
            return this.callZome("send_sync_response", input);
        }
        /** Changes */
        sendChangeRequest(changeRequestInput) {
            const input = Object.assign(Object.assign({}, changeRequestInput), { deltas: changeRequestInput.deltas.map((d) => encode(d)) });
            return this.callZome("send_change_request", input);
        }
        sendChange(sendChangeInput) {
            const input = Object.assign(Object.assign({}, sendChangeInput), { changes: this.encodeChangeBundle(sendChangeInput.changes) });
            return this.callZome("send_change", input);
        }
        /** Heartbeat */
        sendHeartbeat(heartbeatInput) {
            return this.callZome("send_heartbeat", heartbeatInput);
        }
        /** Helpers */
        async callZome(fnName, payload) {
            return this.cellClient.callZome(this.zomeName, fnName, payload);
        }
        decodeSessionInfo(sessionInfo) {
            const commits = {};
            for (const [hash, commit] of Object.entries(sessionInfo.commits)) {
                commits[hash] = this.decodeCommit(commit);
            }
            return Object.assign(Object.assign({}, sessionInfo), { commits, snapshot: decode(sessionInfo.snapshot) });
        }
        encodeCommit(commit) {
            return Object.assign(Object.assign({}, commit), { changes: this.encodeChangeBundle(commit.changes) });
        }
        encodeChangeBundle(changes) {
            return Object.assign(Object.assign({}, changes), { deltas: changes.deltas.map((d) => encode(d)) });
        }
        decodeCommit(commit) {
            return Object.assign(Object.assign({}, commit), { changes: {
                    deltas: commit.changes.deltas.map((d) => decode(d)),
                } });
        }
    }

    function initialState(myPubKey) {
        const internalStore = {
            myPubKey,
            activeSessionHash: undefined,
            joinedSessions: {},
            commits: {},
            snapshots: {},
        };
        return internalStore;
    }

    function amIScribe(synState, sessionHash) {
        return selectScribe(synState, sessionHash) === synState.myPubKey;
    }
    function selectScribe(synState, sessionHash) {
        const session = synState.joinedSessions[sessionHash];
        return session.session.scribe;
    }
    function selectSession(synState, sessionHash) {
        return synState.joinedSessions[sessionHash];
    }
    function selectLastCommitTime(state, sessionHash) {
        const commit = selectLatestCommit(state, sessionHash);
        if (commit)
            return commit.createdAt;
        else
            return selectSession(state, sessionHash).session.createdAt;
    }
    function selectLatestCommit(state, sessionHash) {
        const commitHash = selectLatestCommitHash(selectSession(state, sessionHash));
        return commitHash ? state.commits[commitHash] : undefined;
    }
    function selectLatestCommitHash(session) {
        if (session.commitHashes.length === 0)
            return undefined;
        return session.commitHashes[session.commitHashes.length - 1];
    }
    function selectLatestCommittedContentHash(synState, sessionHash) {
        const latestCommit = selectLatestCommit(synState, sessionHash);
        if (latestCommit)
            return latestCommit.newContentHash;
        // If there is no commit after the initial snapshot,
        // the last committed entry hash is the initial snapshot hash
        return synState.joinedSessions[sessionHash].session.snapshotHash;
    }
    function selectAllCommits(synState, sessionHash) {
        const session = synState.joinedSessions[sessionHash];
        return session.commitHashes.map((hash) => [hash, synState.commits[hash]]);
    }
    // Returns the commits that have been missed since the last session change seen
    function selectMissedCommits(synState, sessionHash, latestSeenSessionIndex) {
        const commits = selectAllCommits(synState, sessionHash);
        const missedCommits = {};
        // Traverse the commits in reverse order, and when we find one that has already been seen, return
        for (const commit of commits.reverse()) {
            if (commit[1].changes.atSessionIndex > latestSeenSessionIndex) {
                missedCommits[commit[0]] = commit[1];
            }
            else {
                return missedCommits;
            }
        }
        return missedCommits;
    }
    function selectMissedUncommittedChanges(synState, sessionHash, latestSeenSessionIndex) {
        const sessionWorkspace = synState.joinedSessions[sessionHash];
        if (sessionWorkspace.uncommittedChanges.atSessionIndex >= latestSeenSessionIndex)
            return sessionWorkspace.uncommittedChanges;
        else {
            // Only return the changes that they haven't seen yet
            const uncommittedChanges = sessionWorkspace.uncommittedChanges;
            const uncommittedDeltaIndex = latestSeenSessionIndex - uncommittedChanges.atSessionIndex;
            return {
                atSessionIndex: latestSeenSessionIndex + 1,
                deltas: uncommittedChanges.deltas.slice(uncommittedDeltaIndex),
                authors: uncommittedChanges.authors, // TODO: optimization of only sending the authors of the missed deltas?
            };
        }
    }
    function selectCurrentSessionIndex(sessionWorkspace) {
        return (sessionWorkspace.uncommittedChanges.atSessionIndex +
            sessionWorkspace.uncommittedChanges.deltas.length);
    }
    function selectFolksInSession(sessionWorkspace) {
        return Object.entries(sessionWorkspace.folks)
            .filter(([_, info]) => info.inSession)
            .map(([f, _]) => f);
    }

    function putJustSeenFolks(session, myPubKey, folks) {
        const now = Date.now();
        for (const folk of folks) {
            if (folk !== myPubKey) {
                session.folks[folk] = {
                    lastSeen: now,
                    inSession: true,
                };
            }
        }
    }

    /**
     * Scribe is managing the session, a folk comes in:
     *
     * - Folk: `SyncRequest`
     *     "Hey scribe! So I think I'm out of date and I don't know all the latest changes.
     *      This is the latest changes I've seen... Help me please?"
     * - Scribe: `SyncResponse`
     *     "Oh sure! Here is the commits you missed since you were gone, and here are the
     *      uncommitted changes on top of them. From now on I'll update you whenever a change happens."
     *
     */
    function handleSyncRequest(workspace, sessionHash, requestSyncInput) {
        workspace.store.update((synState) => {
            if (!amIScribe(synState, sessionHash)) {
                console.log("syncReq received but I'm not the scribe!");
                return synState;
            }
            const session = selectSession(synState, sessionHash);
            putJustSeenFolks(session, synState.myPubKey, [requestSyncInput.folk]);
            const missedCommits = selectMissedCommits(synState, sessionHash, requestSyncInput.lastSessionIndexSeen);
            const uncommittedChanges = selectMissedUncommittedChanges(synState, sessionHash, requestSyncInput.lastSessionIndexSeen);
            const syncState = {
                uncommittedChanges,
                missedCommits,
                //currentContentHash:
            };
            workspace.client.sendSyncResponse({
                participant: requestSyncInput.folk,
                state: syncState,
                sessionHash,
            });
            const participants = selectFolksInSession(session);
            workspace.client.sendFolkLore({
                participants,
                sessionHash,
                data: { participants: [...participants, synState.myPubKey] },
            });
            return synState;
        });
    }

    function orderCommits(initialContentHash, commits) {
        let byPreviousContentHash = {};
        for (const [hash, commit] of Object.entries(commits)) {
            byPreviousContentHash[commit.previousContentHash] = hash;
        }
        let orderedCommits = [];
        let contentHash = initialContentHash;
        while (Object.keys(byPreviousContentHash).length > 0) {
            if (!byPreviousContentHash[contentHash])
                throw new Error("We have a corrupted chain of commits");
            orderedCommits.push(byPreviousContentHash[contentHash]);
            byPreviousContentHash[contentHash] = undefined;
            delete byPreviousContentHash[contentHash];
        }
        return orderedCommits;
    }
    function applyCommits(initialContent, applyDeltaFn, commits) {
        let content = initialContent;
        for (const commit of commits) {
            content = applyChangeBundle(content, applyDeltaFn, commit.changes);
        }
        return content;
    }
    function applyChangeBundle(initialContent, applyDeltaFn, changeBundle) {
        let content = initialContent;
        for (const delta of changeBundle.deltas) {
            content = applyDeltaFn(content, delta);
        }
        return content;
    }

    function handleSyncResponse(workspace, sessionHash, stateForSync) {
        workspace.store.update((state) => {
            const sessionWorkspace = selectSession(state, sessionHash);
            // Put the missed commits in the state
            const latestCommittedContentHash = selectLatestCommittedContentHash(state, sessionHash);
            const missedCommitHashes = orderCommits(latestCommittedContentHash, stateForSync.missedCommits);
            for (const missedCommitHash of missedCommitHashes) {
                state.commits[missedCommitHash] =
                    stateForSync.missedCommits[missedCommitHash];
            }
            sessionWorkspace.commitHashes = [
                ...sessionWorkspace.commitHashes,
                ...missedCommitHashes,
            ];
            // Put the uncommitted changes in the state
            const uncommittedChanges = sessionWorkspace.uncommittedChanges;
            const lastSeenIndex = uncommittedChanges.atSessionIndex + uncommittedChanges.deltas.length;
            if (lastSeenIndex !== stateForSync.uncommittedChanges.atSessionIndex)
                throw new Error(`I requested changes from session index ${lastSeenIndex} and received changes from ${stateForSync.uncommittedChanges.atSessionIndex}`);
            uncommittedChanges.deltas = [
                ...uncommittedChanges.deltas,
                ...stateForSync.uncommittedChanges.deltas,
            ];
            uncommittedChanges.authors = merge$1(uncommittedChanges.authors, stateForSync.uncommittedChanges.authors);
            // Apply all deltas
            const commitArray = missedCommitHashes.map((missedCommitHash) => stateForSync.missedCommits[missedCommitHash]);
            let currentContent = applyCommits(sessionWorkspace.currentContent, workspace.applyDeltaFn, commitArray);
            sessionWorkspace.currentContent = applyChangeBundle(currentContent, workspace.applyDeltaFn, stateForSync.uncommittedChanges);
            return state;
        });
    }

    function buildCommitFromUncommitted(state, sessionHash, newContentHash) {
        const session = selectSession(state, sessionHash);
        const lastCommitHash = selectLatestCommitHash(session);
        return {
            changes: session.uncommittedChanges,
            newContentHash,
            previousCommitHashes: lastCommitHash ? [lastCommitHash] : [],
            previousContentHash: selectLatestCommittedContentHash(state, sessionHash),
            createdAt: Date.now(),
            meta: {
                appSpecific: null,
                witnesses: [],
            },
        };
    }
    function putNewCommit(state, sessionHash, newCommitHash, commit) {
        state.commits[newCommitHash] = commit;
        const session = selectSession(state, sessionHash);
        session.commitHashes.push(newCommitHash);
        const newSessionIndex = commit.changes.atSessionIndex + commit.changes.deltas.length;
        session.uncommittedChanges = {
            atSessionIndex: newSessionIndex,
            authors: {},
            deltas: [],
        };
    }

    async function commitChanges(workspace, sessionHash) {
        const state = get_store_value(workspace.store);
        if (!amIScribe(state, sessionHash)) {
            console.log("Trying to commit the changes but I'm not the scribe!");
            return state;
        }
        let session = selectSession(state, sessionHash);
        const hash = await workspace.client.hashContent(session.currentContent);
        const commit = buildCommitFromUncommitted(state, sessionHash, hash);
        const commitInput = {
            commit,
            participants: selectFolksInSession(session),
            sessionHash,
            sessionSnapshot: session.session.snapshotHash,
        };
        const newCommitHash = await workspace.client.commit(commitInput);
        // TODO: what happens if we have a new change while committing?
        workspace.store.update((state) => {
            putNewCommit(state, sessionHash, newCommitHash, commit);
            return state;
        });
    }

    function scribeRequestChange(workspace, sessionHash, deltas) {
        workspace.store.update((state) => {
            const session = selectSession(state, sessionHash);
            const changeBundle = putDeltas(workspace.applyDeltaFn, session, state.myPubKey, session.myFolkIndex, deltas);
            workspace.client.sendChange({
                participants: selectFolksInSession(session),
                sessionHash,
                changes: changeBundle,
            });
            triggerCommitIfNecessary(workspace, sessionHash, session.uncommittedChanges.deltas.length);
            session.myFolkIndex += deltas.length;
            return state;
        });
    }
    function handleChangeRequest(workspace, sessionHash, changeRequest) {
        workspace.store.update((state) => {
            if (!amIScribe(state, sessionHash)) {
                console.warn(`Received a change request but I'm not the scribe for this session`);
                return state;
            }
            const session = selectSession(state, sessionHash);
            putJustSeenFolks(session, state.myPubKey, [changeRequest.folk]);
            const currentSessionIndex = selectCurrentSessionIndex(session);
            if (currentSessionIndex !== changeRequest.atSessionIndex) {
                console.warn("Scribe is receiving change out of order!");
                console.warn(`nextIndex: ${currentSessionIndex}, changeIndex:${changeRequest.atSessionIndex} for deltas:`, changeRequest.deltas);
                if (changeRequest.atSessionIndex < currentSessionIndex) {
                    // change is too late, nextIndex has moved on
                    // TODO: rebase? notify sender?
                    return state;
                }
                else {
                    // change is in the future, possibly some other change was dropped or is slow in arriving
                    // TODO: wait a bit?  Ask sender for other changes?
                    return state;
                }
            }
            const changeBundle = putDeltas(workspace.applyDeltaFn, session, changeRequest.folk, changeRequest.atFolkIndex, changeRequest.deltas);
            workspace.client.sendChange({
                changes: changeBundle,
                participants: selectFolksInSession(session),
                sessionHash,
            });
            triggerCommitIfNecessary(workspace, sessionHash, session.uncommittedChanges.deltas.length);
            return state;
        });
    }
    function triggerCommitIfNecessary(workspace, sessionHash, uncommittedChangesCount) {
        if (workspace.config.commitStrategy
            .CommitEveryNDeltas &&
            workspace.config.commitStrategy
                .CommitEveryNDeltas <= uncommittedChangesCount) {
            commitChanges(workspace, sessionHash);
        }
    }
    function putDeltas(applyDeltaFn, session, author, atFolkIndex, deltas) {
        const previousSessionIndex = selectCurrentSessionIndex(session);
        // Immediately update the contents of the session
        session.uncommittedChanges.deltas = [
            ...session.uncommittedChanges.deltas,
            ...deltas,
        ];
        let currentContent = session.currentContent;
        for (const delta of deltas) {
            currentContent = applyDeltaFn(currentContent, delta);
        }
        session.currentContent = currentContent;
        // Build the change bundle
        const authorChanges = [];
        for (let i = previousSessionIndex; i < previousSessionIndex + deltas.length; i++) {
            authorChanges.push(i);
        }
        const folkChanges = {
            atFolkIndex,
            sessionChanges: authorChanges,
        };
        return {
            atSessionIndex: previousSessionIndex,
            deltas,
            authors: {
                [author]: folkChanges,
            },
        };
    }

    function handleCommitNotice(workspace, sessionHash, commitNotice) {
        workspace.store.update((state) => {
            if (amIScribe(state, sessionHash)) {
                console.log("Received a commit notice but I'm the scribe!");
                return state;
            }
            const latestCommittedContentHash = selectLatestCommittedContentHash(state, sessionHash);
            const session = selectSession(state, sessionHash);
            if (latestCommittedContentHash === commitNotice.previousContentHash &&
                commitNotice.committedDeltasCount ===
                    session.uncommittedChanges.deltas.length) {
                const commit = buildCommitFromUncommitted(state, sessionHash, commitNotice.newContentHash);
                putNewCommit(state, sessionHash, commitNotice.commitHash, commit);
            }
            return state;
        });
    }

    function handleFolkLore(workspace, sessionHash, folklore) {
        workspace.store.update((state) => {
            if (amIScribe(state, sessionHash)) {
                console.log("Received folklore but I'm the scribe, ignoring");
                return state;
            }
            const session = selectSession(state, sessionHash);
            if (folklore.gone) {
                putGoneFolks(session, folklore.gone);
            }
            else {
                putJustSeenFolks(session, state.myPubKey, folklore.participants);
            }
            return state;
        });
    }
    function putGoneFolks(session, goneFolks) {
        for (const goneFolk of goneFolks) {
            if (!session.folks[goneFolk]) {
                session.folks[goneFolk] = {
                    inSession: false,
                    lastSeen: 0, // First time we are seeing this folk
                };
            }
            else {
                session.folks[goneFolk].inSession = false;
            }
        }
    }

    function notifyGoneFolks(workspace, sessionHash) {
        workspace.store.update((state) => {
            const session = selectSession(state, sessionHash);
            const gone = updateGoneFolks(session, workspace.config.outOfSessionTimeout);
            if (gone.length > 0) {
                workspace.client.sendFolkLore({
                    data: { gone },
                    participants: selectFolksInSession(session),
                    sessionHash,
                });
            }
            return state;
        });
    }
    function handleHeartbeat(workspace, sessionHash, fromFolk) {
        workspace.store.update((state) => {
            if (!amIScribe(state, sessionHash)) {
                console.log("Received a heartbeat from a folk but I'm not the scribe");
                return state;
            }
            const session = selectSession(state, sessionHash);
            putJustSeenFolks(session, state.myPubKey, [fromFolk]);
            return state;
        });
    }
    function updateGoneFolks(sessionWorkspace, outOfSessionTimeout) {
        const gone = [];
        const now = Date.now();
        for (const folk of Object.keys(sessionWorkspace.folks)) {
            if (now - sessionWorkspace.folks[folk].lastSeen > outOfSessionTimeout) {
                sessionWorkspace.folks[folk].inSession = false;
                gone.push(folk);
            }
        }
        return gone;
    }

    // Pick and join a session
    async function joinSession(workspace, sessionHash) {
        const session = await workspace.client.getSession(sessionHash);
        const orderedCommitHashes = orderCommits(session.session.snapshotHash, session.commits);
        const orderedCommits = orderedCommitHashes.map((hash) => session.commits[hash]);
        const currentContent = applyCommits(session.snapshot, workspace.applyDeltaFn, orderedCommits);
        workspace.store.update((state) => {
            state.joinedSessions[session.sessionHash] = {
                sessionHash: session.sessionHash,
                session: session.session,
                commitHashes: orderedCommitHashes,
                currentContent,
                myFolkIndex: 0,
                prerequestContent: undefined,
                requestedChanges: [],
                uncommittedChanges: {
                    atSessionIndex: 0,
                    authors: {},
                    deltas: [],
                },
                folks: {},
            };
            if (session.session.scribe !== state.myPubKey) {
                workspace.client.sendSyncRequest({
                    scribe: session.session.scribe,
                    sessionHash: session.sessionHash,
                    lastSessionIndexSeen: 0,
                });
            }
            state.activeSessionHash = session.sessionHash;
            return state;
        });
    }

    function folkRequestChange(workspace, sessionHash, deltas) {
        workspace.store.update((state) => {
            const session = selectSession(state, sessionHash);
            // TODO: don't do this if strategy === CRDT
            session.prerequestContent = cloneDeep(session.currentContent);
            for (const delta of deltas) {
                session.currentContent = workspace.applyDeltaFn(session.currentContent, delta);
            }
            const newRequestedChanges = [];
            const atDate = Date.now();
            console.log(session.uncommittedChanges);
            const currentSessionIndex = selectCurrentSessionIndex(session);
            for (let i = 0; i < deltas.length; i++) {
                newRequestedChanges.push({
                    atDate,
                    atFolkIndex: session.myFolkIndex + i,
                    atSessionIndex: currentSessionIndex + i,
                    delta: deltas[i],
                });
            }
            session.requestedChanges = [
                ...session.requestedChanges,
                ...newRequestedChanges,
            ];
            workspace.client.sendChangeRequest({
                atFolkIndex: session.myFolkIndex,
                atSessionIndex: currentSessionIndex,
                deltas,
                scribe: session.session.scribe,
                sessionHash,
            });
            session.myFolkIndex += deltas.length;
            return state;
        });
    }
    async function checkRequestedChanges(workspace, sessionHash) {
        let state = get_store_value(workspace.store);
        if (amIScribe(state, sessionHash)) {
            return;
        }
        let session = selectSession(state, sessionHash);
        console.log(session.requestedChanges);
        if (session.requestedChanges.length > 0 &&
            Date.now() - session.requestedChanges[0].atDate >
                workspace.config.requestTimeout) {
            // send a sync request incase something just got out of sequence
            // TODO: prepare for shifting to new scribe if they went offline
            await joinSession(workspace, sessionHash);
            state = get_store_value(workspace.store);
            session = selectSession(state, sessionHash);
            await workspace.client.sendSyncRequest({
                lastSessionIndexSeen: selectCurrentSessionIndex(session),
                scribe: session.session.scribe,
                sessionHash,
            });
        }
    }
    // Folk
    function handleChangeNotice(workspace, sessionHash, changes) {
        workspace.store.update((state) => {
            if (amIScribe(state, sessionHash)) {
                console.warn(`Received a change notice but I'm the scribe for this session, ignoring`);
                return state;
            }
            const session = selectSession(state, sessionHash);
            // TODO
            // If CRDT, we don't care about requested changes
            // If BlockOnConflict, we try to rebase and block if applyDelta returns conflict
            session.currentContent = applyChangeBundle(session.currentContent, workspace.applyDeltaFn, changes);
            session.uncommittedChanges.deltas = [
                ...session.uncommittedChanges.deltas,
                changes.deltas,
            ];
            for (const [author, newFolkChanges] of Object.entries(session.uncommittedChanges.authors)) {
                if (!session.uncommittedChanges.authors[author]) {
                    session.uncommittedChanges.authors[author] = newFolkChanges;
                }
                else {
                    const folkChanges = session.uncommittedChanges.authors[author];
                    if (folkChanges.atFolkIndex + folkChanges.sessionChanges.length !==
                        newFolkChanges.atFolkIndex) ;
                    folkChanges.sessionChanges = [
                        ...folkChanges.sessionChanges,
                        ...newFolkChanges.sessionChanges,
                    ];
                }
            }
            const myChanges = changes.authors[state.myPubKey];
            if (myChanges) {
                clearRequested(session, myChanges);
            }
            return state;
        });
    }
    function clearRequested(session, myChanges) {
        const leftRequestedChanges = [];
        for (const requestedChange of session.requestedChanges) {
            if (!(requestedChange.atFolkIndex >= myChanges.atFolkIndex &&
                requestedChange.atFolkIndex <
                    myChanges.atFolkIndex + myChanges.sessionChanges.length)) {
                leftRequestedChanges.push(requestedChange);
            }
        }
        session.requestedChanges = leftRequestedChanges;
        if (session.requestedChanges.length === 0) {
            session.prerequestContent = undefined;
        }
    }

    function handleSignal(workspace, signal) {
        const currentState = get_store_value(workspace.store);
        if (!selectSession(currentState, signal.sessionHash)) {
            console.warn(`We are getting a signal for a sesion we don't know about`);
            return;
        }
        switch (signal.message.type) {
            case SynMessageType.SyncReq:
                return handleSyncRequest(workspace, signal.sessionHash, signal.message.payload);
            case SynMessageType.SyncResp:
                return handleSyncResponse(workspace, signal.sessionHash, signal.message.payload);
            case SynMessageType.ChangeReq:
                return handleChangeRequest(workspace, signal.sessionHash, signal.message.payload);
            case SynMessageType.ChangeNotice:
                return handleChangeNotice(workspace, signal.sessionHash, signal.message.payload);
            case SynMessageType.CommitNotice:
                return handleCommitNotice(workspace, signal.sessionHash, signal.message.payload);
            case SynMessageType.FolkLore:
                return handleFolkLore(workspace, signal.sessionHash, signal.message.payload);
            case SynMessageType.Heartbeat:
                return handleHeartbeat(workspace, signal.sessionHash, signal.message.payload.fromFolk);
        }
    }

    var SyncStrategy;
    (function (SyncStrategy) {
        SyncStrategy[SyncStrategy["CRDT"] = 0] = "CRDT";
        SyncStrategy[SyncStrategy["BlockOnConflict"] = 1] = "BlockOnConflict";
        SyncStrategy[SyncStrategy["DropOnConflict"] = 2] = "DropOnConflict";
    })(SyncStrategy || (SyncStrategy = {}));
    function defaultConfig() {
        return {
            hearbeatInterval: 30 * 1000,
            outOfSessionTimeout: 8 * 1000,
            requestTimeout: 1000,
            commitStrategy: { CommitEveryNDeltas: 20, CommitEveryNMs: 2 * 1000 * 60 },
            syncStrategy: SyncStrategy.BlockOnConflict,
        };
    }

    function heartbeat(workspace, sessionHash) {
        const state = get_store_value(workspace.store);
        if (amIScribe(state, sessionHash))
            return notifyGoneFolks(workspace, sessionHash);
        else {
            // I'm not the scribe so send them a heartbeat
            return workspace.client.sendHeartbeat({
                scribe: selectScribe(state, sessionHash),
                data: "hi",
                sessionHash: sessionHash,
            });
        }
    }

    function initBackgroundTasks(workspace) {
        const intervals = [];
        const heartbeatInterval = setInterval(() => {
            const state = get_store_value(workspace.store);
            for (const sessionHash of Object.keys(state.joinedSessions)) {
                heartbeat(workspace, sessionHash);
            }
        }, workspace.config.hearbeatInterval);
        intervals.push(heartbeatInterval);
        const checkRequestInterval = setInterval(() => {
            const state = get_store_value(workspace.store);
            for (const sessionHash of Object.keys(state.joinedSessions)) {
                checkRequestedChanges(workspace, sessionHash);
            }
        }, workspace.config.requestTimeout / 2);
        intervals.push(checkRequestInterval);
        const CommitEveryNMs = workspace.config.commitStrategy.CommitEveryNMs;
        if (CommitEveryNMs) {
            const commitInterval = setInterval(() => {
                const state = get_store_value(workspace.store);
                for (const sessionHash of Object.keys(state.joinedSessions)) {
                    const latestCommitTime = selectLastCommitTime(state, sessionHash);
                    if (amIScribe(state, sessionHash) &&
                        Date.now() - latestCommitTime > CommitEveryNMs) {
                        commitChanges(workspace, sessionHash);
                    }
                }
            }, CommitEveryNMs / 10);
            intervals.push(commitInterval);
        }
        return {
            cancel: () => intervals.forEach((i) => clearInterval(i)),
        };
    }

    // Folk or scribe
    function requestChange(workspace, sessionHash, deltas) {
        const state = get_store_value(workspace.store);
        if (amIScribe(state, sessionHash))
            return scribeRequestChange(workspace, sessionHash, deltas);
        else
            return folkRequestChange(workspace, sessionHash, deltas);
    }

    function buildSessionStore(workspace, sessionHash) {
        const content = derived(workspace.store, state => selectSession(state, sessionHash).currentContent);
        const folks = derived(workspace.store, state => selectSession(state, sessionHash).folks);
        return {
            hash: sessionHash,
            info: selectSession(get_store_value(workspace.store), sessionHash).session,
            content,
            folks,
            requestChange: deltas => requestChange(workspace, sessionHash, deltas),
            leave: async () => { }, // TODO
        };
    }

    // Pick and join a session
    async function newSession(workspace, fromSnapshot) {
        let currentContent = workspace.initialContent;
        if (fromSnapshot) {
            currentContent = await workspace.client.getSnapshot(fromSnapshot);
        }
        else {
            fromSnapshot = await workspace.client.putSnapshot(workspace.initialContent);
        }
        const session = await workspace.client.newSession({
            snapshotHash: fromSnapshot,
        });
        workspace.store.update((state) => {
            state.joinedSessions[session.sessionHash] = {
                sessionHash: session.sessionHash,
                session: session.session,
                commitHashes: [],
                currentContent,
                myFolkIndex: 0,
                prerequestContent: undefined,
                requestedChanges: [],
                uncommittedChanges: {
                    atSessionIndex: 0,
                    authors: {},
                    deltas: [],
                },
                folks: {},
            };
            state.activeSessionHash = session.sessionHash;
            return state;
        });
        return session.sessionHash;
    }

    function createSynStore(cellClient, initialContent, applyDeltaFn, config) {
        let workspace = undefined;
        const fullConfig = merge$1(config, defaultConfig());
        const state = initialState(serializeHash(cellClient.cellId[1]));
        const store = writable(state);
        const client = new SynClient(cellClient, signal => handleSignal(workspace, signal));
        workspace = {
            store,
            applyDeltaFn,
            client,
            initialContent,
            config: fullConfig,
        };
        const { cancel } = initBackgroundTasks(workspace);
        const activeSession = derived(store, state => {
            if (state.activeSessionHash)
                return buildSessionStore(workspace, state.activeSessionHash);
        });
        return {
            getAllSessions: () => client.getSessions(),
            joinSession: async (sessionHash) => joinSession(workspace, sessionHash),
            activeSession,
            joinedSessions: derived(workspace.store, state => Object.keys(state.joinedSessions)),
            sessionStore: sessionHash => buildSessionStore(workspace, sessionHash),
            newSession: async (fromSnapshot) => newSession(workspace, fromSnapshot),
            close: async () => {
                client.close();
                cancel();
            },
        };
    }

    // definition of how to apply a delta to the content
    // if the delta is destructive also returns what was
    // destroyed for use by undo
    function applyDelta(content, delta) {
      switch (delta.type) {
        case 'Title': {
          const deleted = content.title;
          content.title = delta.value;
          return [content, { delta, deleted }];
        }
        case 'Add': {
          const [loc, text] = delta.value;
          content.body =
            content.body.slice(0, loc) + text + content.body.slice(loc);
          return [content, { delta }];
        }
        case 'Delete': {
          const [start, end] = delta.value;
          const deleted = content.body.slice(start, end);
          content.body = content.body.slice(0, start) + content.body.slice(end);
          return [content, { delta, deleted }];
        }
        case 'Meta': {
          const [tag, loc] = delta.value.setLoc;
          const deleted = [tag, content.meta[tag]];
          content.meta[tag] = loc;
          return [content, { delta, deleted }];
        }
      }
    }

    async function createStore() {
      const appWebsocket = await AppWebsocket$1.connect('ws://localhost:8888');

      const cellData = await appWebsocket.appInfo({
        installed_app_id: 'syn',
      });

      const client = new HolochainClient(appWebsocket, cellData.cell_data[0]);

      return createSynStore(client, { title: '', body: '' }, applyDelta);
    }

    /* src/App.svelte generated by Svelte v3.42.4 */

    const { document: document_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let div1;
    	let h1;
    	let t2;
    	let div0;
    	let title;
    	let t3;
    	let main;
    	let div2;
    	let editor;
    	let t4;
    	let div3;
    	let folks;
    	let t5;
    	let div5;
    	let div4;
    	let i;
    	let i_class_value;
    	let t6;
    	let div8;
    	let div6;
    	let t7;
    	let div7;
    	let history;
    	let t8;
    	let debug_1;
    	let t9;
    	let syn_context;
    	let syn_folks;
    	let current;
    	let mounted;
    	let dispose;
    	title = new Title({ $$inline: true });
    	title.$on("requestChange", /*requestChange_handler*/ ctx[14]);
    	editor = new Editor({ $$inline: true });
    	editor.$on("requestChange", /*requestChange_handler_1*/ ctx[15]);
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
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "SynText";
    			t2 = space();
    			div0 = element("div");
    			create_component(title.$$.fragment);
    			t3 = space();
    			main = element("main");
    			div2 = element("div");
    			create_component(editor.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			create_component(folks.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			i = element("i");
    			t6 = space();
    			div8 = element("div");
    			div6 = element("div");
    			t7 = space();
    			div7 = element("div");
    			create_component(history.$$.fragment);
    			t8 = space();
    			create_component(debug_1.$$.fragment);
    			t9 = space();
    			syn_context = element("syn-context");
    			syn_folks = element("syn-folks");
    			if (!src_url_equal(script.src, script_src_value = "https://kit.fontawesome.com/80d72fa568.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file, 112, 2, 3024);
    			attr_dev(h1, "class", "svelte-1ygbi8h");
    			add_location(h1, file, 118, 2, 3162);
    			toggle_class(div0, "noscribe", /*noscribe*/ ctx[5]);
    			add_location(div0, file, 119, 2, 3181);
    			attr_dev(div1, "class", "toolbar svelte-1ygbi8h");
    			add_location(div1, file, 117, 0, 3138);
    			toggle_class(div2, "noscribe", /*noscribe*/ ctx[5]);
    			add_location(div2, file, 124, 2, 3301);
    			attr_dev(main, "class", "svelte-1ygbi8h");
    			add_location(main, file, 123, 0, 3292);
    			attr_dev(div3, "class", "folks-tray svelte-1ygbi8h");
    			add_location(div3, file, 129, 0, 3415);

    			attr_dev(i, "class", i_class_value = "tab-icon fas " + (/*drawerHidden*/ ctx[3]
    			? 'fa-chevron-up'
    			: 'fa-chevron-down') + " svelte-1ygbi8h");

    			toggle_class(i, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			add_location(i, file, 145, 4, 3717);
    			attr_dev(div4, "class", "tab-inner svelte-1ygbi8h");
    			toggle_class(div4, "shown", /*tabShown*/ ctx[4]);
    			add_location(div4, file, 140, 2, 3597);
    			attr_dev(div5, "class", "tab svelte-1ygbi8h");
    			toggle_class(div5, "shown", /*tabShown*/ ctx[4]);
    			toggle_class(div5, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			add_location(div5, file, 133, 0, 3460);
    			attr_dev(div6, "class", "handle svelte-1ygbi8h");
    			add_location(div6, file, 159, 2, 4024);
    			attr_dev(div7, "class", "debug-content svelte-1ygbi8h");
    			add_location(div7, file, 160, 2, 4103);
    			add_location(syn_folks, file, 166, 4, 4238);
    			set_custom_element_data(syn_context, "store", /*synStore*/ ctx[0]);
    			add_location(syn_context, file, 165, 2, 4203);
    			attr_dev(div8, "class", "debug-drawer svelte-1ygbi8h");
    			toggle_class(div8, "hidden", /*drawerHidden*/ ctx[3]);
    			add_location(div8, file, 151, 0, 3864);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			mount_component(title, div0, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(editor, div2, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(folks, div3, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, i);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div6);
    			/*div6_binding*/ ctx[16](div6);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			mount_component(history, div7, null);
    			append_dev(div7, t8);
    			mount_component(debug_1, div7, null);
    			append_dev(div8, t9);
    			append_dev(div8, syn_context);
    			append_dev(syn_context, syn_folks);
    			/*div8_binding*/ ctx[17](div8);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						div4,
    						"click",
    						function () {
    							if (is_function(/*drawerHidden*/ ctx[3]
    							? /*showDrawer*/ ctx[10]()
    							: /*hideDrawer*/ ctx[9]())) (/*drawerHidden*/ ctx[3]
    							? /*showDrawer*/ ctx[10]()
    							: /*hideDrawer*/ ctx[9]()).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(div5, "mouseenter", /*showTab*/ ctx[11], false, false, false),
    					listen_dev(div5, "mouseleave", /*hideTab*/ ctx[12], false, false, false),
    					listen_dev(div6, "mousedown", /*startDragging*/ ctx[8], false, false, false),
    					action_destroyer(/*initResizeable*/ ctx[7].call(null, div8)),
    					listen_dev(div8, "mouseenter", /*showTab*/ ctx[11], false, false, false),
    					listen_dev(div8, "mouseleave", /*hideTab*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*noscribe*/ 32) {
    				toggle_class(div0, "noscribe", /*noscribe*/ ctx[5]);
    			}

    			if (dirty & /*noscribe*/ 32) {
    				toggle_class(div2, "noscribe", /*noscribe*/ ctx[5]);
    			}

    			if (!current || dirty & /*drawerHidden*/ 8 && i_class_value !== (i_class_value = "tab-icon fas " + (/*drawerHidden*/ ctx[3]
    			? 'fa-chevron-up'
    			: 'fa-chevron-down') + " svelte-1ygbi8h")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*drawerHidden, drawerHidden*/ 8) {
    				toggle_class(i, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			}

    			if (dirty & /*tabShown*/ 16) {
    				toggle_class(div4, "shown", /*tabShown*/ ctx[4]);
    			}

    			if (dirty & /*tabShown*/ 16) {
    				toggle_class(div5, "shown", /*tabShown*/ ctx[4]);
    			}

    			if (dirty & /*drawerHidden*/ 8) {
    				toggle_class(div5, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			}

    			if (!current || dirty & /*synStore*/ 1) {
    				set_custom_element_data(syn_context, "store", /*synStore*/ ctx[0]);
    			}

    			if (dirty & /*drawerHidden*/ 8) {
    				toggle_class(div8, "hidden", /*drawerHidden*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(editor.$$.fragment, local);
    			transition_in(folks.$$.fragment, local);
    			transition_in(history.$$.fragment, local);
    			transition_in(debug_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(editor.$$.fragment, local);
    			transition_out(folks.$$.fragment, local);
    			transition_out(history.$$.fragment, local);
    			transition_out(debug_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_component(title);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(main);
    			destroy_component(editor);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			destroy_component(folks);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div8);
    			/*div6_binding*/ ctx[16](null);
    			destroy_component(history);
    			destroy_component(debug_1);
    			/*div8_binding*/ ctx[17](null);
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

    const minDrawerSize = 0;

    // definition of how to convert a change to text for the history renderer
    function changeToText(change) {
    	let delta = change.delta;
    	let detail;

    	switch (delta.type) {
    		case 'Add':
    			detail = `${delta.value[1]}@${delta.value[0]}`;
    			break;
    		case 'Delete':
    			detail = `${change.deleted}@${delta.value[0]}`;
    			break;
    		case 'Title':
    			detail = `${change.deleted}->${delta.value}`;
    			break;
    		case 'Meta':
    			detail = '';
    	}

    	return `${delta.type}:\n${detail}`;
    }

    function instance($$self, $$props, $$invalidate) {
    	let disconnected;
    	let noscribe;
    	let $scribeStr;
    	validate_store(scribeStr, 'scribeStr');
    	component_subscribe($$self, scribeStr, $$value => $$invalidate(13, $scribeStr = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let syn;

    	// The debug drawer's ability to resized and hidden
    	let resizeable;

    	let resizeHandle;
    	const maxDrawerSize = document.documentElement.clientHeight - 30 - 10;

    	const initResizeable = resizeableEl => {
    		resizeableEl.style.setProperty('--max-height', `${maxDrawerSize}px`);
    		resizeableEl.style.setProperty('--min-height', `${minDrawerSize}px`);
    	};

    	const setDrawerHeight = height => {
    		document.documentElement.style.setProperty('--resizeable-height', `${height}px`);
    	};

    	const getDrawerHeight = () => {
    		const pxHeight = getComputedStyle(resizeable).getPropertyValue('--resizeable-height');
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
    				window.removeEventListener('pointermove', mouseDragHandler);
    				return;
    			}

    			setDrawerHeight(Math.min(Math.max(yOffset - moveEvent.pageY + startingDrawerHeight, minDrawerSize), maxDrawerSize));
    		};

    		window.addEventListener('pointermove', mouseDragHandler);
    	};

    	let drawerHidden = false;

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

    	let synStore;
    	createStore().then(store => $$invalidate(0, synStore = store));
    	customElements.define('syn-context', SynContext);
    	customElements.define('syn-folks', SynFolks);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const requestChange_handler = event => syn.requestChange(event.detail);
    	const requestChange_handler_1 = event => syn.requestChange(event.detail);

    	function div6_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			resizeHandle = $$value;
    			$$invalidate(2, resizeHandle);
    		});
    	}

    	function div8_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			resizeable = $$value;
    			$$invalidate(1, resizeable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Editor,
    		Title,
    		Folks,
    		Debug,
    		History,
    		content,
    		scribeStr,
    		SynContext,
    		SynFolks,
    		createStore,
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
    		synStore,
    		noscribe,
    		disconnected,
    		$scribeStr
    	});

    	$$self.$inject_state = $$props => {
    		if ('syn' in $$props) $$invalidate(6, syn = $$props.syn);
    		if ('resizeable' in $$props) $$invalidate(1, resizeable = $$props.resizeable);
    		if ('resizeHandle' in $$props) $$invalidate(2, resizeHandle = $$props.resizeHandle);
    		if ('drawerHidden' in $$props) $$invalidate(3, drawerHidden = $$props.drawerHidden);
    		if ('tabShown' in $$props) $$invalidate(4, tabShown = $$props.tabShown);
    		if ('synStore' in $$props) $$invalidate(0, synStore = $$props.synStore);
    		if ('noscribe' in $$props) $$invalidate(5, noscribe = $$props.noscribe);
    		if ('disconnected' in $$props) disconnected = $$props.disconnected;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$scribeStr*/ 8192) {
    			$$invalidate(5, noscribe = $scribeStr === '');
    		}

    		if ($$self.$$.dirty & /*synStore*/ 1) ;
    	};

    	disconnected = false;

    	return [
    		synStore,
    		resizeable,
    		resizeHandle,
    		drawerHidden,
    		tabShown,
    		noscribe,
    		syn,
    		initResizeable,
    		startDragging,
    		hideDrawer,
    		showDrawer,
    		showTab,
    		hideTab,
    		$scribeStr,
    		requestChange_handler,
    		requestChange_handler_1,
    		div6_binding,
    		div8_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
