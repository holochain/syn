
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
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
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
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

    var admin$1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    //# sourceMappingURL=admin.js.map
    });

    var app$2 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    //# sourceMappingURL=app.js.map
    });

    var types = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fakeAgentPubKey = void 0;
    exports.fakeAgentPubKey = (x) => Buffer.from([0x84, 0x20, 0x24].concat('000000000000000000000000000000000000'
        .split('')
        .map((x) => parseInt(x, 10))));
    //# sourceMappingURL=types.js.map
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

    var TEXT_ENCODING_AVAILABLE = (typeof process === "undefined" || process.env["TEXT_ENCODING"] !== "never") &&
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
        ? STR_SIZE_MAX
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

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
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
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }

    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    }

    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
            var value = utf8DecodeJs(bytes, inputOffset, byteLength);
            // Ensure to copy a slice of bytes because the byte may be NodeJS Buffer and Buffer#slice() returns a reference to its internal ArrayBuffer.
            var slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
            this.store(slicedCopyOfBytes, value);
            return value;
        };
        return CachedKeyDecoder;
    }());

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
        Decoder.prototype.decodeMulti = function (buffer) {
            return __generator(this, function (_a) {
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
    /**
     * It decodes multiple MessagePack objects in a buffer.
     * This is corresponding to {@link decodeMultiStream()}.
     */
    function decodeMulti(buffer, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        var decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
        return decoder.decodeMulti(buffer);
    }

    // utility for whatwg streams
    function isAsyncIterable(object) {
        return object[Symbol.asyncIterator] != null;
    }
    function assertNonNull(value) {
        if (value == null) {
            throw new Error("Assertion Failure: value must not be null nor undefined");
        }
    }
    function asyncIterableFromStream(stream) {
        return __asyncGenerator(this, arguments, function asyncIterableFromStream_1() {
            var reader, _a, done, value;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        reader = stream.getReader();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, , 9, 10]);
                        _b.label = 2;
                    case 2:
                        return [4 /*yield*/, __await(reader.read())];
                    case 3:
                        _a = _b.sent(), done = _a.done, value = _a.value;
                        if (!done) return [3 /*break*/, 5];
                        return [4 /*yield*/, __await(void 0)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5:
                        assertNonNull(value);
                        return [4 /*yield*/, __await(value)];
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
    function ensureAsyncIterable(streamLike) {
        if (isAsyncIterable(streamLike)) {
            return streamLike;
        }
        else {
            return asyncIterableFromStream(streamLike);
        }
    }

    function decodeAsync(streamLike, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        return __awaiter(this, void 0, void 0, function () {
            var stream, decoder;
            return __generator(this, function (_a) {
                stream = ensureAsyncIterable(streamLike);
                decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
                return [2 /*return*/, decoder.decodeAsync(stream)];
            });
        });
    }
    function decodeArrayStream(streamLike, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        var stream = ensureAsyncIterable(streamLike);
        var decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
        return decoder.decodeArrayStream(stream);
    }
    function decodeMultiStream(streamLike, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        var stream = ensureAsyncIterable(streamLike);
        var decoder = new Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
        return decoder.decodeStream(stream);
    }
    /**
     * @deprecated Use {@link decodeMultiStream()} instead.
     */
    function decodeStream(streamLike, options) {
        if (options === void 0) { options = defaultDecodeOptions; }
        return decodeMultiStream(streamLike, options);
    }

    // Main Functions:

    var dist_es5_esm = /*#__PURE__*/Object.freeze({
        __proto__: null,
        encode: encode,
        decode: decode,
        decodeMulti: decodeMulti,
        decodeAsync: decodeAsync,
        decodeArrayStream: decodeArrayStream,
        decodeMultiStream: decodeMultiStream,
        decodeStream: decodeStream,
        Decoder: Decoder,
        DecodeError: DecodeError,
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

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(dist_es5_esm);

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
        constructor(socket, signalCb) {
            this.socket = socket;
            this.pendingRequests = {};
            this.index = 0;
            // TODO: allow adding signal handlers later
            this.alreadyWarnedNoSignalCb = false;
            socket.onmessage = (encodedMsg) => __awaiter(this, void 0, void 0, function* () {
                let data = encodedMsg.data;
                // If data is not a buffer (nodejs), it will be a blob (browser)
                if (typeof Buffer === "undefined" || !Buffer.isBuffer(data)) {
                    data = yield data.arrayBuffer();
                }
                const msg = msgpack.decode(data);
                if (msg.type === "Signal") {
                    if (signalCb) {
                        const decodedMessage = msgpack.decode(msg.data);
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
            const encodedMsg = msgpack.encode({
                type: "Signal",
                data: msgpack.encode(data),
            });
            this.socket.send(encodedMsg);
        }
        request(data) {
            let id = this.index;
            this.index += 1;
            const encodedMsg = msgpack.encode({
                id,
                type: "Request",
                data: msgpack.encode(data),
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
                    this.pendingRequests[id].fulfill(msgpack.decode(msg.data));
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
                const socket = new isomorphic_ws_1.default(url);
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
    exports.WsClient = WsClient;
    const signalTransform = (res) => {
        return msgpack.decode(res);
    };
    //# sourceMappingURL=client.js.map
    });

    var common$1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.promiseTimeout = exports.catchError = exports.DEFAULT_TIMEOUT = void 0;
    const ERROR_TYPE = 'error';
    exports.DEFAULT_TIMEOUT = 15000;
    exports.catchError = (res) => {
        return res.type === ERROR_TYPE
            ? Promise.reject(res)
            : Promise.resolve(res);
    };
    exports.promiseTimeout = (promise, tag, ms) => {
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
    //# sourceMappingURL=common.js.map
    });

    var common = createCommonjsModule(function (module, exports) {
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
    exports.requesterTransformer = (requester, tag, transform = identityTransformer) => ((req, timeout) => __awaiter(void 0, void 0, void 0, function* () {
        const input = { type: tag, data: transform.input(req) };
        const response = yield requester(input, timeout);
        const output = transform.output(response.data);
        return output;
    }));
    const identity = x => x;
    const identityTransformer = {
        input: identity,
        output: identity,
    };
    //# sourceMappingURL=common.js.map
    });

    var admin = createCommonjsModule(function (module, exports) {
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
        constructor(client, defaultTimeout) {
            this._requester = (tag, transformer) => common.requesterTransformer((req, timeout) => common$1.promiseTimeout(this.client.request(req), tag, timeout || this.defaultTimeout).then(common$1.catchError), tag, transformer);
            // the specific request/response types come from the Interface
            // which this class implements
            this.activateApp = this._requester('activate_app');
            this.attachAppInterface = this._requester('attach_app_interface');
            this.deactivateApp = this._requester('deactivate_app');
            this.dumpState = this._requester('dump_state', dumpStateTransform);
            this.generateAgentPubKey = this._requester('generate_agent_pub_key');
            this.registerDna = this._requester('register_dna');
            this.installApp = this._requester('install_app');
            this.installAppBundle = this._requester('install_app_bundle');
            this.createCloneCell = this._requester('create_clone_cell');
            this.listDnas = this._requester('list_dnas');
            this.listCellIds = this._requester('list_cell_ids');
            this.listActiveApps = this._requester('list_active_apps');
            this.requestAgentInfo = this._requester('request_agent_info');
            this.addAgentInfo = this._requester('add_agent_info');
            this.client = client;
            this.defaultTimeout = defaultTimeout === undefined ? common$1.DEFAULT_TIMEOUT : defaultTimeout;
        }
        static connect(url, defaultTimeout) {
            return __awaiter(this, void 0, void 0, function* () {
                const wsClient = yield client.WsClient.connect(url);
                return new AdminWebsocket(wsClient, defaultTimeout);
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
    //# sourceMappingURL=admin.js.map
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
        constructor(client, defaultTimeout) {
            this._requester = (tag, transformer) => common.requesterTransformer((req, timeout) => common$1.promiseTimeout(this.client.request(req), tag, timeout || this.defaultTimeout).then(common$1.catchError), tag, transformer);
            this.appInfo = this._requester('app_info');
            this.callZome = this._requester('zome_call_invocation', callZomeTransform);
            this.client = client;
            this.defaultTimeout = defaultTimeout === undefined ? common$1.DEFAULT_TIMEOUT : defaultTimeout;
        }
        static connect(url, defaultTimeout, signalCb) {
            return __awaiter(this, void 0, void 0, function* () {
                const wsClient = yield client.WsClient.connect(url, signalCb);
                return new AppWebsocket(wsClient, defaultTimeout);
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
    //# sourceMappingURL=app.js.map
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
    __exportStar(admin$1, exports);
    __exportStar(app$2, exports);
    __exportStar(types, exports);
    __exportStar(admin, exports);
    __exportStar(app$1, exports);
    //# sourceMappingURL=index.js.map
    });

    /**
     * Object.assign
     */
    const assign = Object.assign;

    const pending_symbol = Symbol('pending');
    /**
     * Returns a function to ensure that an member key is defined on a ctx object,
     * otherwise it creates the value using the _val factory function.
     */
    function _be(key, _val) {
        return (ctx, opts) => {
            if (!ctx.hasOwnProperty(key) || (opts === null || opts === void 0 ? void 0 : opts.force)) {
                let pending = ctx[pending_symbol];
                if (!pending) {
                    pending = {};
                    assign(ctx, { [pending_symbol]: pending });
                }
                if (pending[key]) {
                    console.trace(`_be: key '${key.toString()}' has a circular dependency`);
                    throw `_be: key '${key.toString()}' has a circular dependency`;
                }
                pending[key] = true;
                const val = _val(ctx, key, opts);
                if (!ctx.hasOwnProperty(key)) {
                    if (val === undefined)
                        throw `_be: ${String(key)}: function must return a non-undefined value or directly set the ctx with the property ${String(key)}`;
                    assign(ctx, { [key]: val });
                }
                delete pending[key];
            }
            return ctx[key];
        };
    }

    /**
     * Object keys
     */
    Object.keys.bind(Object);

    const native_isArray = Array.isArray;
    /**
     * Is the argument an Array?
     */
    function isArray(obj) {
        return native_isArray ? native_isArray(obj) : toString.call(obj) === '[object Array]';
    }

    /**
     * Object values
     * @function values
     */
    Object.values.bind(Object);

    function _tuple(...data) {
        return data;
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
    function derived$1(stores, fn, initial_value) {
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

    function get(store) {
        return get_store_value(store);
    }

    function derived(stores, in_fn, initial_value) {
        return (in_fn.length === 1
            ? derived$1(stores, ((values) => {
                return in_fn((isArray(values) ? _tuple(...values) : values));
            }))
            : derived$1(stores, ((values, set) => {
                return in_fn((isArray(values) ? _tuple(...values) : values), set);
            }), initial_value));
    }

    const content_b = _be('content', () => {
        return writable({ title: '', body: '' });
    });

    const committedChanges_b = _be('committedChanges', () => {
        return writable([]);
    });

    const recordedChanges_b = _be('recordedChanges', () => {
        return writable([]);
    });

    const nextIndex_b = _be('nextIndex', (ctx) => {
        const recordedChanges = recordedChanges_b(ctx);
        return derived(recordedChanges, c => c.length);
    });

    const requestedChanges_b = _be('requestedChanges', () => {
        return writable([]);
    });

    const bufferToBase64 = buffer => {
        if (typeof window !== 'undefined') {
            // browser
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        }
        else {
            // nodejs
            return buffer.toString('base64');
        }
    };
    const base64ToBuffer = base64 => {
        if (!base64)
            return;
        if (typeof window !== 'undefined') {
            return Uint8Array.from(window.atob(base64), c => c.charCodeAt(0));
        }
        else {
            return Buffer.from(base64, 'base64');
        }
    };
    function decodeJson(jsonStr) {
        return JSON.parse(jsonStr, function (key, value) {
            // the receiver function looks for the typed array flag
            try {
                if (key == 'pubKey') {
                    return base64ToBuffer(value);
                }
            }
            catch (e) {
                console.log('decodeJson Error:', e);
            }
            // if flag not found no conversion is done
            return value;
        });
    }
    function encodeJson(obj) {
        return JSON.stringify(obj, function (key, value) {
            if (key == 'pubKey') {
                if (typeof window !== 'undefined') {
                    return bufferToBase64(value); // In the browser it's the actual array
                }
                else {
                    return bufferToBase64(Buffer.from(value.data)); // In node it's an object
                }
            }
            return value;
        });
    }

    // retruns binary input as hex number string (e.g. 'a293b8e1a')
    function arrayBufferToHex(buffer) {
        let hexString = '';
        for (const byte of buffer) {
            hexString += byte.toString(16);
        }
        return hexString;
    }
    // converts RGB to HSL
    // Source: https://gist.github.com/mjackson/5311256
    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max == min) {
            h = s = 0;
        }
        else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return [h * 360, s * 100, l * 100];
    }
    // Source: https://stackoverflow.com/questions/5842747
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
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
        const r = parseInt(hexColor.substr(1, 2), 16); // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        // convert to HSL
        let hsl = rgbToHsl(r, g, b);
        // limit color to be bright enough and not too bright
        hsl[1] = clamp(hsl[1], 10, 90); // limit s
        const [h, s] = hsl; // destructure
        return {
            primary: [h, s, 50],
            hexagon: [h, s, 25],
            selection: [h, s, 90],
            lookingSelection: [h, s, 80],
            lookingCursor: [h, s + 10, 40],
        };
    }
    function CSSifyHSL(hslArray) {
        const [h, s, l] = hslArray;
        return `hsl(${h} ${s}% ${l}%)`;
    }

    const folks_b = _be('folk', () => {
        return writable({});
    });

    const scribeStr_b = _be('scribeStr', () => {
        return writable('');
    });

    /* src/folk/Folk.svelte generated by Svelte v3.37.0 */
    const file$8 = "src/folk/Folk.svelte";

    // (88:0) {#if $connection && $connection.syn}
    function create_if_block$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*scribe*/ ctx[2]) return create_if_block_1$2;
    		return create_else_block$3;
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(88:0) {#if $connection && $connection.syn}",
    		ctx
    	});

    	return block;
    }

    // (97:2) {:else}
    function create_else_block$3(ctx) {
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
    			attr_dev(div0, "class", "folk-color svelte-6nts23");
    			add_location(div0, file$8, 98, 6, 3226);
    			attr_dev(div1, "class", "folk svelte-6nts23");
    			toggle_class(div1, "me", /*me*/ ctx[1]);
    			toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[3]);
    			add_location(div1, file$8, 97, 4, 3143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = action_destroyer(/*setUpHex*/ ctx[8].call(null, div1));
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
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(97:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (89:2) {#if scribe}
    function create_if_block_1$2(ctx) {
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
    			attr_dev(div0, "class", "folk-color svelte-6nts23");
    			add_location(div0, file$8, 91, 8, 3006);
    			attr_dev(div1, "class", "folk scribe svelte-6nts23");
    			toggle_class(div1, "me", /*me*/ ctx[1]);
    			toggle_class(div1, "out-of-session", /*outOfSession*/ ctx[3]);
    			add_location(div1, file$8, 90, 6, 2914);
    			attr_dev(div2, "class", "scribe-halo svelte-6nts23");
    			add_location(div2, file$8, 94, 6, 3086);
    			attr_dev(div3, "class", "scribe-wrapper svelte-6nts23");
    			add_location(div3, file$8, 89, 4, 2879);
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
    				dispose = action_destroyer(/*setUpHex*/ ctx[8].call(null, div1));
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(89:2) {#if scribe}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*$connection*/ ctx[4] && /*$connection*/ ctx[4].syn && create_if_block$4(ctx);

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
    					if_block = create_if_block$4(ctx);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $scribeStr;
    	let $folks;
    	let $connection;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Folk", slots, []);
    	const ctx = getContext("ctx");
    	const connection = connection_b(ctx);
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, value => $$invalidate(4, $connection = value));
    	const folks = folks_b(ctx);
    	validate_store(folks, "folks");
    	component_subscribe($$self, folks, value => $$invalidate(10, $folks = value));
    	const scribeStr = scribeStr_b(ctx);
    	validate_store(scribeStr, "scribeStr");
    	component_subscribe($$self, scribeStr, value => $$invalidate(9, $scribeStr = value));
    	let { pubKeyStr = "" } = $$props;
    	let { me = false } = $$props;
    	let scribe;
    	let outOfSession;

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

    	const writable_props = ["pubKeyStr", "me"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Folk> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("pubKeyStr" in $$props) $$invalidate(0, pubKeyStr = $$props.pubKeyStr);
    		if ("me" in $$props) $$invalidate(1, me = $$props.me);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		connection_b,
    		folks_b,
    		CSSifyHSL,
    		scribeStr_b,
    		ctx,
    		connection,
    		folks,
    		scribeStr,
    		pubKeyStr,
    		me,
    		scribe,
    		outOfSession,
    		setUpHex,
    		$scribeStr,
    		$folks,
    		$connection
    	});

    	$$self.$inject_state = $$props => {
    		if ("pubKeyStr" in $$props) $$invalidate(0, pubKeyStr = $$props.pubKeyStr);
    		if ("me" in $$props) $$invalidate(1, me = $$props.me);
    		if ("scribe" in $$props) $$invalidate(2, scribe = $$props.scribe);
    		if ("outOfSession" in $$props) $$invalidate(3, outOfSession = $$props.outOfSession);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pubKeyStr, $scribeStr*/ 513) {
    			$$invalidate(2, scribe = pubKeyStr == $scribeStr);
    		}

    		if ($$self.$$.dirty & /*$folks, pubKeyStr, me*/ 1027) {
    			$$invalidate(3, outOfSession = (!$folks[pubKeyStr] || !$folks[pubKeyStr].inSession) && !me);
    		}
    	};

    	return [
    		pubKeyStr,
    		me,
    		scribe,
    		outOfSession,
    		$connection,
    		connection,
    		folks,
    		scribeStr,
    		setUpHex,
    		$scribeStr,
    		$folks
    	];
    }

    class Folk extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { pubKeyStr: 0, me: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Folk",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get pubKeyStr() {
    		throw new Error("<Folk>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pubKeyStr(value) {
    		throw new Error("<Folk>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get me() {
    		throw new Error("<Folk>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set me(value) {
    		throw new Error("<Folk>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/folk/Folks.svelte generated by Svelte v3.37.0 */

    const { Object: Object_1$1 } = globals;
    const file$7 = "src/folk/Folks.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (21:2) {#if $connection && $connection.syn && $connection.syn.me}
    function create_if_block$3(ctx) {
    	let folk;
    	let current;

    	folk = new Folk({
    			props: {
    				me: true,
    				pubKeyStr: /*$connection*/ ctx[0].syn.me
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
    		source: "(21:2) {#if $connection && $connection.syn && $connection.syn.me}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#each Object.keys($folks) as p}
    function create_each_block$2(ctx) {
    	let folk;
    	let current;

    	folk = new Folk({
    			props: { pubKeyStr: /*p*/ ctx[5] },
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
    			if (dirty & /*$folks*/ 2) folk_changes.pubKeyStr = /*p*/ ctx[5];
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(24:2) {#each Object.keys($folks) as p}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let t;
    	let current;
    	let if_block = /*$connection*/ ctx[0] && /*$connection*/ ctx[0].syn && /*$connection*/ ctx[0].syn.me && create_if_block$3(ctx);
    	let each_value = Object.keys(/*$folks*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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

    			attr_dev(div, "class", "folks svelte-ekfsic");
    			add_location(div, file$7, 19, 0, 528);
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
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $connection;
    	let $folks;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Folks", slots, []);
    	const ctx = getContext("ctx");
    	const folks = folks_b(ctx);
    	validate_store(folks, "folks");
    	component_subscribe($$self, folks, value => $$invalidate(1, $folks = value));
    	const connection = connection_b(ctx);
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, value => $$invalidate(0, $connection = value));
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Folks> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		connection_b,
    		folks_b,
    		Folk,
    		getContext,
    		ctx,
    		folks,
    		connection,
    		$connection,
    		$folks
    	});

    	return [$connection, $folks, folks, connection];
    }

    class Folks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Folks",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    var FolkStatus;
    (function (FolkStatus) {
        FolkStatus[FolkStatus["FOLK_SEEN"] = 1] = "FOLK_SEEN";
        FolkStatus[FolkStatus["FOLK_GONE"] = 2] = "FOLK_GONE";
        FolkStatus[FolkStatus["FOLK_UNKNOWN"] = 3] = "FOLK_UNKNOWN";
    })(FolkStatus || (FolkStatus = {}));
    const FOLK_SEEN = FolkStatus.FOLK_SEEN;
    const FOLK_GONE = FolkStatus.FOLK_GONE;
    const FOLK_UNKNOWN = FolkStatus.FOLK_UNKNOWN;

    // const outOfSessionTimout = 30 * 1000
    const outOfSessionTimout = 8 * 1000; // testing code :)
    // const heartbeatInterval = 15 * 1000 // 15 seconds
    const heartbeatInterval = 30 * 1000; // for testing ;)
    let reqTimeout = 1000;
    class Session {
        constructor(ctx, syn, sessionInfo) {
            this.ctx = ctx;
            this.sessionInfo = sessionInfo;
            // set up the svelte based state vars
            this.content = content_b(this.ctx);
            this.recordedChanges = recordedChanges_b(this.ctx);
            this.requestedChanges = requestedChanges_b(this.ctx);
            this.committedChanges = committedChanges_b(this.ctx);
            this.scribeStr = scribeStr_b(this.ctx);
            this.zome = syn.zome;
            this.applyDeltaFn = syn.applyDeltaFn;
            this.me = syn.zome.me;
            this.myTag = syn.zome.me.slice(-4);
            const others = {};
            this.others = others;
            this.folks = folks_b(ctx);
            this.folks.set(others);
            this.initState(this.sessionInfo);
            this.initTimers(syn);
            console.log('session joined:', this.sessionInfo);
        }
        initTimers(syn) {
            const self = this;
            // Send heartbeat to scribe every [heartbeat interval]
            this.heart = setInterval(async () => {
                if (self._scribeStr == self.me) {
                    // examine folks last seen time and see if any have crossed the session out-of-session
                    // timeout so we can tell everybody else about them having dropped.
                    let gone = self.updateRecentlyTimedOutFolks();
                    if (gone.length > 0) {
                        self.sendFolkLore(self.folksForScribeSignals(), { gone });
                    }
                }
                else {
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
                        console.log('HERE');
                        syn.sendSyncReq();
                    }
                }
            }, reqTimeout / 2);
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
            let newContent = Object.assign({}, sessionInfo.snapshot_content); // clone so as not to pass by ref
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
        recordDeltas(_index, deltas) {
            console.log('recordDeltas REQUESTED', this.requested);
            for (const delta of deltas) {
                if (this.requested.length > 0) {
                    // if this change is our next requested change then remove it
                    if (JSON.stringify(delta) == JSON.stringify(this.requested[0].delta)) {
                        this.recorded.push(this.requested.shift());
                        this.recordedChanges.set(this.recorded);
                        this.requestedChanges.set(this.requested);
                    }
                    else {
                        // TODO rebase?
                        console.log('REBASE NEEDED?');
                        console.log('requested ', this.requested[0].delta);
                        console.log('to be recorded ', delta);
                    }
                }
                else {
                    // no requested changes so this must be from someone else so we don't have
                    // to check our requested changes
                    // TODO: do we need to check if this is a change that we did send and have already
                    // integrated somehow and ignore if so.  (Seems unlikely?)
                    this._recordDelta(delta);
                }
            }
        }
        nextIndex() {
            return this.recorded.length;
        }
        _runApplyDelta(delta) {
            const [newContent, undoableChange] = this.applyDeltaFn(this._content, delta);
            this._content = newContent;
            this.content.set(this._content);
            return undoableChange;
        }
        // called when requesting a change to the content as a result of user action
        // If we are the scribe, no need to go into the zome
        // TODO: prevent reentry
        requestChange(deltas) {
            // any requested made by the scribe should be recorded immediately
            if (this._scribeStr == this.me) {
                const index = this.nextIndex();
                this._recordDeltas(deltas);
                this.sendChange(index, deltas);
            }
            else {
                // otherwise apply the change and queue it to requested changes for
                // confirmation later and send request change to scribe
                // create a unique id for each change
                // TODO: this should be part of actual changeReqs
                const changeId = this.myTag + '.' + this.reqCounter;
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
                console.log('REQUESTED', this.requested);
                this.sendChangeReq(index, deltas);
                this.reqCounter += 1;
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
                    return;
                }
                else {
                    // change is in the future, possibly some other change was dropped or is slow in arriving
                    // TODO: wait a bit?  Ask sender for other changes?
                    return;
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
                    return;
                }
                this.commitInProgress = true;
                const newContentHash = await this.hashContent(this._content);
                console.log('commiting from snapshot', this.snapshotHashStr);
                console.log('  prev_hash:', this.contentHashStr);
                console.log('   new_hash:', bufferToBase64(newContentHash));
                const commit = {
                    snapshot: this.snapshot_hash,
                    change: {
                        deltas: this.recorded.map(c => JSON.stringify(c.delta)),
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
                    console.log('Error:', e);
                }
                this.commitInProgress = false;
            }
            else {
                alert('You ain\'t the scribe!');
            }
        }
        // Folks --------------------------------------------------------
        _newOther(pubKeyStr, pubKey) {
            if (!(pubKeyStr in this.others)) {
                const colors = getFolkColors(pubKey);
                this.others[pubKeyStr] = { pubKey, colors };
            }
        }
        updateOthers(pubKey, status, meta) {
            const pubKeyStr = bufferToBase64(pubKey);
            if (pubKeyStr == this.me) {
                return;
            }
            // if we don't have this key, create a record for it
            // including the default color
            this._newOther(pubKeyStr, pubKey);
            if (meta) {
                this.others[pubKeyStr]['meta'] = meta;
            }
            switch (status) {
                case FOLK_SEEN:
                    this.others[pubKeyStr]['inSession'] = true;
                    this.others[pubKeyStr]['lastSeen'] = Date.now();
                    break;
                case FOLK_GONE:
                case FOLK_UNKNOWN:
                    this.others[pubKeyStr]['inSession'] = false;
            }
            this.folks.set(this.others);
        }
        folksForScribeSignals() {
            return Object.values(this.others).filter(v => v.inSession).map(v => v.pubKey);
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
            return result;
        }
        async hashContent(content) {
            return this.zome.call('hash_content', content);
        }
        // senders ---------------------------------------------------------------------
        // These are the functions that send signals in the context of a session
        async sendHeartbeat(data) {
            data = encodeJson(data);
            return this.zome.call('send_heartbeat', { scribe: this.scribe, data });
        }
        async sendChangeReq(index, deltas) {
            deltas = deltas.map(d => JSON.stringify(d));
            return this.zome.call('send_change_request', { scribe: this.scribe, change: [index, deltas] });
        }
        async sendChange(index, deltas) {
            const participants = this.folksForScribeSignals();
            if (participants.length > 0) {
                deltas = deltas.map(d => JSON.stringify(d));
                return this.zome.call('send_change', { participants, change: [index, deltas] });
            }
        }
        async sendFolkLore(participants, data) {
            if (participants.length > 0) {
                data = encodeJson(data);
                return this.zome.call('send_folk_lore', { participants, data });
            }
        }
        async sendSyncResp(to, state) {
            state.deltas = state.deltas.map(d => JSON.stringify(d));
            return this.zome.call('send_sync_response', {
                participant: to,
                state
            });
        }
        // signal handlers ------------------------------------------
        // handler for the changeReq event
        changeReq(change) {
            if (this._scribeStr == this.me) {
                this.addChangeAsScribe(change);
            }
            else {
                console.log('change requested but I\'m not the scribe.');
            }
        }
        // handler for the change event
        change(index, deltas) {
            if (this._scribeStr == this.me) {
                console.log('change received but I\'m the scribe, so I\'m ignoring this!');
            }
            else {
                console.log(`change arrived for ${index}:`, deltas);
                if (this.nextIndex() == index) {
                    this.recordDeltas(index, deltas);
                }
                else {
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
                let p = Object.assign({}, this.others);
                p[this.me] = {
                    pubKey: this.zome.agentPubKey
                };
                const data = {
                    participants: p
                };
                this.sendFolkLore(this.folksForScribeSignals(), data);
            }
            else {
                console.log('syncReq received but I\'m not the scribe!');
            }
        }
        // handler for the syncResp event
        syncResp(stateForSync) {
            // Make sure that we are working off the same snapshot and commit
            const commitContentHashStr = bufferToBase64(stateForSync.commit_content_hash);
            if (commitContentHashStr == this.contentHashStr) {
                this._recordDeltas(stateForSync.deltas);
            }
            else {
                console.log('WHOA, sync response has different current state assumptions');
                // TODO: resync somehow
            }
        }
        // handler for the heartbeat event
        heartbeat(from, data) {
            console.log('got heartbeat', data, 'from:', from);
            if (this._scribeStr != this.me) {
                console.log('heartbeat received but I\'m not the scribe.');
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
                console.log('folklore received but I\'m the scribe!');
            }
            else {
                if (data.gone) {
                    Object.values(data.participants).forEach(pubKey => {
                        this.updateOthers(pubKey, FOLK_GONE);
                    });
                }
                // TODO move last seen into p.meta so that we can update that value
                // as hearsay.
                if (data.participants) {
                    Object.values(data.participants).forEach(p => {
                        this.updateOthers(p.pubKey, FOLK_UNKNOWN, p.meta);
                    });
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
            }
            else {
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

    const session_b = _be('session', () => {
        const session = writable(null);
        return session;
    });

    class Zome {
        constructor(appClient, appId) {
            this.appClient = appClient;
            this.appId = appId;
        }
        async attach() {
            // setup the syn instance data
            this.appInfo = await this.appClient.appInfo({ installed_app_id: this.appId });
            this.cellId = this.appInfo.cell_data[0].cell_id;
            this.agentPubKey = this.cellId[1];
            this.dna = this.cellId[0];
            this.dnaStr = bufferToBase64(this.dna);
            this.me = bufferToBase64(this.agentPubKey);
        }
        attached() {
            return this.appInfo != undefined;
        }
        async call(fn_name, payload, timeout) {
            if (!this.attached()) {
                console.log('Can\'t call zome when disconnected from conductor');
                return;
            }
            try {
                const zome_name = 'syn';
                console.log(`Making zome call ${fn_name} with:`, payload);
                const result = await this.appClient.callZome({
                    cap: null,
                    cell_id: this.cellId,
                    zome_name,
                    fn_name,
                    provenance: this.agentPubKey,
                    payload
                }, timeout);
                return result;
            }
            catch (error) {
                console.log('ERROR: callZome threw error', error);
                throw (error);
                //  if (error == 'Error: Socket is not open') {
                // TODO        return doResetConnection(dispatch)
                // }
            }
        }
    }

    class Syn$1 {
        constructor(ctx, defaultContent, applyDeltaFn, appClient, appId) {
            this.ctx = ctx;
            this.defaultContent = defaultContent;
            this.applyDeltaFn = applyDeltaFn;
            this.appClient = appClient;
            this.appId = appId;
            this.zome = new Zome(this.appClient, this.appId);
            this.session = session_b(this.ctx);
            this.folks = folks_b(this.ctx);
            this.connection = connection_b(this.ctx);
            this.scribeStr = scribeStr_b(this.ctx);
            window.syn = this;
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
                return undefined;
            });
        }
        async callZome(fn_name, payload, timeout) {
            return this.zome.call(fn_name, payload, timeout);
        }
        async getFolks() {
            return this.callZome('get_folks');
        }
        async getSessions() {
            return this.callZome('get_sessions');
        }
        async getSession(session_hash) {
            return this.callZome('get_session', session_hash);
        }
        async newSession() {
            const rawSessionInfo = await this.callZome('new_session', { content: this.defaultContent });
            const $session = new Session(this.ctx, this, rawSessionInfo);
            this.session.set($session);
            return $session;
        }
        async sendSyncReq() {
            return this.callZome('send_sync_request', { scribe: get(this.session).scribe });
        }
    }

    class Connection {
        constructor(ctx, appPort, appId) {
            this.ctx = ctx;
            this.appPort = appPort;
            this.appId = appId;
        }
        async open(defaultContent, applyDeltaFn) {
            const self = this;
            this.appClient = await lib.AppWebsocket.connect(`ws://localhost:${this.appPort}`, 30000, (signal) => signalHandler(self, signal));
            console.log('connection established:', this);
            // TODO: in the future we should be able manage and to attach to multiple syn happs
            this.syn = new Syn$1(this.ctx, defaultContent, applyDeltaFn, this.appClient, this.appId);
            await this.syn.attach();
            this.sessions = await this.syn.getSessions();
        }
        async joinSession() {
            if (!this.syn) {
                console.log('join session called without syn app opened');
                return;
            }
            if (this.sessions.length == 0) {
                this.session = await this.syn.newSession();
                this.sessions[0] = this.session.sessionHash;
            }
            else {
                const sessionInfo = await this.syn.getSession(this.sessions[0]);
                this.session = new Session(this.ctx, this.syn, sessionInfo);
                if (this.session._scribeStr != this.syn.me) {
                    await this.syn.sendSyncReq();
                }
            }
        }
    }
    function signalHandler(connection, signal) {
        // ignore signals not meant for me
        if (!connection.syn || bufferToBase64(signal.data.cellId[1]) != connection.syn.me) {
            return;
        }
        console.log('Got Signal', signal.data.payload.signal_name, signal);
        switch (signal.data.payload.signal_name) {
            case 'SyncReq':
                connection.session.syncReq({ from: signal.data.payload.signal_payload });
                break;
            case 'SyncResp':
                const state = signal.data.payload.signal_payload;
                state.deltas = state.deltas.map(d => JSON.parse(d));
                connection.session.syncResp(state);
                break;
            case 'ChangeReq': {
                let [index, deltas] = signal.data.payload.signal_payload;
                deltas = deltas.map(d => JSON.parse(d));
                connection.session.changeReq([index, deltas]);
                break;
            }
            case 'Change': {
                let [index, deltas] = signal.data.payload.signal_payload;
                deltas = deltas.map(d => JSON.parse(d));
                connection.session.change(index, deltas);
                break;
            }
            case 'FolkLore': {
                let data = decodeJson(signal.data.payload.signal_payload);
                connection.session.folklore(data);
                break;
            }
            case 'Heartbeat': {
                let [from, jsonData] = signal.data.payload.signal_payload;
                const data = decodeJson(jsonData);
                connection.session.heartbeat(from, data);
                break;
            }
            case 'CommitNotice':
                connection.session.commitNotice(signal.data.payload.signal_payload);
        }
    }

    const connection_b = _be('connection', () => {
        return writable(null);
    });

    /* src/Editor.svelte generated by Svelte v3.37.0 */

    const { Object: Object_1, console: console_1$2 } = globals;
    const file$6 = "src/Editor.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(span0, file$6, 109, 2, 3567);
    			attr_dev(span1, "class", "cursor svelte-4kugpc");
    			add_location(span1, file$6, 109, 32, 3597);
    			add_location(span2, file$6, 109, 79, 3644);
    			attr_dev(editor_1, "tabindex", "0");
    			attr_dev(editor_1, "start", "0");
    			attr_dev(editor_1, "class", "svelte-4kugpc");
    			add_location(editor_1, file$6, 108, 0, 3470);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, editor_1, anchor);
    			append_dev(editor_1, span0);
    			append_dev(span0, t0);
    			append_dev(editor_1, span1);
    			/*span1_binding*/ ctx[13](span1);
    			append_dev(editor_1, span2);
    			append_dev(span2, t1);
    			/*editor_1_binding*/ ctx[14](editor_1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(editor_1, "click", /*handleClick*/ ctx[8], false, false, false),
    					listen_dev(editor_1, "keydown", /*handleInput*/ ctx[7], false, false, false)
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
    			/*span1_binding*/ ctx[13](null);
    			/*editor_1_binding*/ ctx[14](null);
    			mounted = false;
    			run_all(dispose);
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
    	let myTag;
    	let editor_content1;
    	let editor_content2;
    	let $content;
    	let $session;
    	let $connection;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Editor", slots, []);
    	
    	const ctx = getContext("ctx");
    	const dispatch = createEventDispatcher();
    	const connection = connection_b(ctx);
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, value => $$invalidate(12, $connection = value));
    	const content = content_b(ctx);
    	validate_store(content, "content");
    	component_subscribe($$self, content, value => $$invalidate(9, $content = value));
    	const session = session_b(ctx);
    	validate_store(session, "session");
    	component_subscribe($$self, session, value => $$invalidate(11, $session = value));

    	function getLoc(tag) {
    		return $content.meta
    		? $content.meta[tag] ? $content.meta[tag] : 0
    		: 0;
    	}

    	let editor;

    	function addText(text) {
    		const loc = getLoc(myTag);
    		const deltas = [{ type: "Add", value: [loc, text] }];

    		for (const [tag, tagLoc] of Object.entries($content.meta)) {
    			if (tagLoc >= loc) {
    				deltas.push({
    					type: "Meta",
    					value: { setLoc: [tag, tagLoc + text.length] }
    				});
    			}
    		}

    		dispatch("requestChange", deltas);
    	}

    	function handleInput(event) {
    		const loc = getLoc(myTag);
    		const key = event.key;

    		if (key.length == 1) {
    			addText(key);
    		} else {
    			switch (key) {
    				case "ArrowRight":
    					if (loc < $content.body.length) {
    						dispatch("requestChange", [
    							{
    								type: "Meta",
    								value: { setLoc: [myTag, loc + 1] }
    							}
    						]);
    					}
    					break;
    				case "ArrowLeft":
    					if (loc > 0) {
    						dispatch("requestChange", [
    							{
    								type: "Meta",
    								value: { setLoc: [myTag, loc - 1] }
    							}
    						]);
    					}
    					break;
    				case "Enter":
    					addText("\n");
    					break;
    				case "Backspace":
    					if (loc > 0) {
    						const deltas = [{ type: "Delete", value: [loc - 1, loc] }];

    						for (const [tag, tagLoc] of Object.entries($content.meta)) {
    							if (tagLoc >= loc) {
    								deltas.push({
    									type: "Meta",
    									value: { setLoc: [tag, tagLoc - 1] }
    								});
    							}
    						}

    						dispatch("requestChange", deltas);
    					}
    			}
    		}

    		console.log("input", event.key);
    	}

    	function handleClick(e) {
    		const offset = window.getSelection().focusOffset;
    		let loc = offset > 0 ? offset : 0;

    		if (window.getSelection().focusNode.parentElement == editor.lastChild) {
    			loc += editor_content1.length;
    		}

    		if (loc != getLoc(myTag)) {
    			dispatch("requestChange", [
    				{
    					type: "Meta",
    					value: { setLoc: [myTag, loc] }
    				}
    			]);
    		}
    	}

    	let cursor;
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	function span1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			cursor = $$value;
    			($$invalidate(0, cursor), $$invalidate(12, $connection));
    		});
    	}

    	function editor_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			editor = $$value;
    			$$invalidate(1, editor);
    		});
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getContext,
    		connection_b,
    		content_b,
    		session_b,
    		CSSifyHSL,
    		ctx,
    		dispatch,
    		connection,
    		content,
    		session,
    		getLoc,
    		editor,
    		addText,
    		handleInput,
    		handleClick,
    		cursor,
    		$content,
    		myTag,
    		$session,
    		editor_content1,
    		editor_content2,
    		$connection
    	});

    	$$self.$inject_state = $$props => {
    		if ("editor" in $$props) $$invalidate(1, editor = $$props.editor);
    		if ("cursor" in $$props) $$invalidate(0, cursor = $$props.cursor);
    		if ("myTag" in $$props) $$invalidate(10, myTag = $$props.myTag);
    		if ("editor_content1" in $$props) $$invalidate(2, editor_content1 = $$props.editor_content1);
    		if ("editor_content2" in $$props) $$invalidate(3, editor_content2 = $$props.editor_content2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$session*/ 2048) {
    			$$invalidate(10, myTag = $session ? $session.myTag : "");
    		}

    		if ($$self.$$.dirty & /*$content, myTag*/ 1536) {
    			$$invalidate(2, editor_content1 = $content.body.slice(0, getLoc(myTag)));
    		}

    		if ($$self.$$.dirty & /*$content, myTag*/ 1536) {
    			$$invalidate(3, editor_content2 = $content.body.slice(getLoc(myTag)));
    		}

    		if ($$self.$$.dirty & /*cursor, $connection*/ 4097) {
    			{
    				// wait for cursor and connection and color inside connection to exist
    				// before updating the cursor color
    				if (cursor && $connection && $connection.syn && $connection.syn.myColors) {
    					$$invalidate(0, cursor.style["border-color"] = CSSifyHSL($connection.syn.myColors.primary), cursor);
    				}
    			}
    		}
    	};

    	return [
    		cursor,
    		editor,
    		editor_content1,
    		editor_content2,
    		connection,
    		content,
    		session,
    		handleInput,
    		handleClick,
    		$content,
    		myTag,
    		$session,
    		$connection,
    		span1_binding,
    		editor_1_binding
    	];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Title.svelte generated by Svelte v3.37.0 */

    const { console: console_1$1 } = globals;
    const file$5 = "src/Title.svelte";

    // (97:2) {:else}
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
    			attr_dev(span, "class", "svelte-3yilbg");
    			toggle_class(span, "untitled", /*untitled*/ ctx[4]);
    			add_location(span, file$5, 98, 6, 3234);
    			attr_dev(div, "class", "title svelte-3yilbg");
    			toggle_class(div, "title-hover", /*titleHover*/ ctx[5]);
    			add_location(div, file$5, 97, 4, 3074);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			if_block.m(span, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[12], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[13], false, false, false),
    					listen_dev(div, "click", /*beginEditTitle*/ ctx[8], false, false, false)
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
    		source: "(97:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (95:2) {#if editingTitle}
    function create_if_block$2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "title-input svelte-3yilbg");
    			add_location(input, file$5, 95, 4, 2929);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*titleBeingTyped*/ ctx[1]);
    			/*input_binding*/ ctx[11](input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    					listen_dev(input, "keydown", /*handleTitleKeypress*/ ctx[9], false, false, false),
    					listen_dev(input, "blur", /*saveTitle*/ ctx[7], false, false, false)
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
    			/*input_binding*/ ctx[11](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(95:2) {#if editingTitle}",
    		ctx
    	});

    	return block;
    }

    // (102:8) {:else}
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
    		source: "(102:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (100:8) {#if untitled}
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
    		source: "(100:8) {#if untitled}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*editingTitle*/ ctx[2]) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("Title:\n  ");
    			if_block.c();
    			attr_dev(div, "class", "title-wrapper svelte-3yilbg");
    			add_location(div, file$5, 92, 0, 2867);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $content;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	const ctx = getContext("ctx");
    	const dispatch = createEventDispatcher();
    	const content = content_b(ctx);
    	validate_store(content, "content");
    	component_subscribe($$self, content, value => $$invalidate(0, $content = value));
    	let titleBeingTyped = "";
    	let editingTitle = false;

    	function saveTitle() {
    		if (editingTitle) {
    			// only dispatch a changeReq if the title trying to be saved is different
    			// than the current title
    			if (titleBeingTyped !== $content.title) {
    				let delta = { type: "Title", value: titleBeingTyped };
    				dispatch("requestChange", [delta]);
    			}

    			$$invalidate(1, titleBeingTyped = "");
    			$$invalidate(2, editingTitle = false);
    		} else {
    			console.log("Can't run saveTitle when it wasn't being edited!");
    		}
    	}

    	let titleEl; // variable to bind the title input to when it's created

    	function beginEditTitle() {
    		return __awaiter(this, void 0, void 0, function* () {
    			$$invalidate(5, titleHover = false);
    			$$invalidate(1, titleBeingTyped = $content.title); // fill the field with the current title
    			$$invalidate(2, editingTitle = true);
    			yield tick(); // wait for the title input element to be created
    			titleEl.focus();
    		});
    	}

    	function handleTitleKeypress() {
    		if (event.key == "Enter") {
    			saveTitle();
    		} else if (event.key == "Escape") {
    			// don't save new title & discard changes
    			$$invalidate(1, titleBeingTyped = "");

    			// turn off editing
    			$$invalidate(2, editingTitle = false);
    		}
    	}

    	// keep track of whether the doc is untitled
    	let untitled;

    	let titleHover; // whether the title is being hovered
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		titleBeingTyped = this.value;
    		$$invalidate(1, titleBeingTyped);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
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
    		__awaiter,
    		createEventDispatcher,
    		getContext,
    		tick,
    		content_b,
    		ctx,
    		dispatch,
    		content,
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
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("titleBeingTyped" in $$props) $$invalidate(1, titleBeingTyped = $$props.titleBeingTyped);
    		if ("editingTitle" in $$props) $$invalidate(2, editingTitle = $$props.editingTitle);
    		if ("titleEl" in $$props) $$invalidate(3, titleEl = $$props.titleEl);
    		if ("untitled" in $$props) $$invalidate(4, untitled = $$props.untitled);
    		if ("titleHover" in $$props) $$invalidate(5, titleHover = $$props.titleHover);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$content*/ 1) {
    			$$invalidate(4, untitled = $content.title === "");
    		}
    	};

    	return [
    		$content,
    		titleBeingTyped,
    		editingTitle,
    		titleEl,
    		untitled,
    		titleHover,
    		content,
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Syn.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file$4 = "src/Syn.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (98:4) {:else}
    function create_else_block$1(ctx) {
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(98:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (96:4) {#if $connection}
    function create_if_block_1(ctx) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(96:4) {#if $connection}",
    		ctx
    	});

    	return block;
    }

    // (106:2) {#if sessions}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*sessions*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(106:2) {#if sessions}",
    		ctx
    	});

    	return block;
    }

    // (107:2) {#each sessions as session}
    function create_each_block$1(ctx) {
    	let span;
    	let t0;
    	let t1_value = bufferToBase64(/*session*/ ctx[9]).slice(-4) + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Id: ");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "class", "session svelte-1u2trq8");
    			add_location(span, file$4, 107, 4, 3195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sessions*/ 1 && t1_value !== (t1_value = bufferToBase64(/*session*/ ctx[9]).slice(-4) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(107:2) {#each sessions as session}",
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
    		if (/*$connection*/ ctx[3]) return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*sessions*/ ctx[0] && create_if_block$1(ctx);

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
    			attr_dev(button0, "class", "svelte-1u2trq8");
    			toggle_class(button0, "noscribe", /*noscribe*/ ctx[4]);
    			add_location(button0, file$4, 88, 0, 2805);
    			add_location(h4, file$4, 91, 2, 2877);
    			attr_dev(input0, "class", "svelte-1u2trq8");
    			add_location(input0, file$4, 92, 12, 2920);
    			attr_dev(input1, "class", "svelte-1u2trq8");
    			add_location(input1, file$4, 93, 9, 2958);
    			attr_dev(button1, "class", "svelte-1u2trq8");
    			add_location(button1, file$4, 94, 2, 2987);
    			add_location(div0, file$4, 90, 0, 2869);
    			attr_dev(div1, "class", "sessions");
    			add_location(div1, file$4, 103, 0, 3109);
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
    					listen_dev(button0, "click", /*commitChange*/ ctx[8], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[14]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[15]),
    					listen_dev(button1, "click", /*toggle*/ ctx[7], false, false, false)
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
    					if_block1 = create_if_block$1(ctx);
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
    	let noscribe;
    	let $session;
    	let $connection;
    	let $scribeStr;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Syn", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	const ctx = getContext("ctx");
    	const connection = connection_b(ctx);
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, value => $$invalidate(3, $connection = value));
    	const scribeStr = scribeStr_b(ctx);
    	validate_store(scribeStr, "scribeStr");
    	component_subscribe($$self, scribeStr, value => $$invalidate(13, $scribeStr = value));
    	const session = session_b(ctx);
    	validate_store(session, "session");
    	component_subscribe($$self, session, value => $$invalidate(16, $session = value));
    	let { applyDeltaFn } = $$props, { undoFn } = $$props;

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

    	function toggle() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (!$session) {
    				// if (!$connection) {
    				set_store_value(session, $session = yield join_session(appPort, appId), $session);

    				// $connection = new Connection(ctx, appPort, appId)
    				// await $connection.open({title:'', body:''}, applyDeltaFn)
    				//
    				// session = $connection.syn.session
    				//
    				// console.log('joining session...')
    				// await $connection.joinSession()
    				$$invalidate(0, sessions = $connection.sessions);
    			} else {
    				$connection.syn.clearState();
    				$$invalidate(0, sessions = undefined);
    				console.log("disconnected");
    			}
    		});
    	}

    	function commitChange() {
    		return __awaiter(this, void 0, void 0, function* () {
    			$session.commitChange();
    		});
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
    		if ("applyDeltaFn" in $$props) $$invalidate(10, applyDeltaFn = $$props.applyDeltaFn);
    		if ("undoFn" in $$props) $$invalidate(11, undoFn = $$props.undoFn);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		createEventDispatcher,
    		getContext,
    		bufferToBase64,
    		connection_b,
    		Connection,
    		scribeStr_b,
    		session_b,
    		ctx,
    		connection,
    		scribeStr,
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
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("applyDeltaFn" in $$props) $$invalidate(10, applyDeltaFn = $$props.applyDeltaFn);
    		if ("undoFn" in $$props) $$invalidate(11, undoFn = $$props.undoFn);
    		if ("sessions" in $$props) $$invalidate(0, sessions = $$props.sessions);
    		if ("adminPort" in $$props) adminPort = $$props.adminPort;
    		if ("appPort" in $$props) $$invalidate(1, appPort = $$props.appPort);
    		if ("appId" in $$props) $$invalidate(2, appId = $$props.appId);
    		if ("noscribe" in $$props) $$invalidate(4, noscribe = $$props.noscribe);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$scribeStr*/ 8192) {
    			$$invalidate(4, noscribe = $scribeStr === "");
    		}
    	};

    	return [
    		sessions,
    		appPort,
    		appId,
    		$connection,
    		noscribe,
    		connection,
    		scribeStr,
    		toggle,
    		commitChange,
    		session,
    		applyDeltaFn,
    		undoFn,
    		requestChange,
    		$scribeStr,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Syn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			applyDeltaFn: 10,
    			undoFn: 11,
    			requestChange: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Syn",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*applyDeltaFn*/ ctx[10] === undefined && !("applyDeltaFn" in props)) {
    			console_1.warn("<Syn> was created without expected prop 'applyDeltaFn'");
    		}

    		if (/*undoFn*/ ctx[11] === undefined && !("undoFn" in props)) {
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
    		return this.$$.ctx[12];
    	}

    	set requestChange(value) {
    		throw new Error("<Syn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Debug.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/Debug.svelte";

    // (20:6) {:else}
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
    		source: "(20:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:6) {#if $connection && $connection.syn}
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
    		source: "(18:6) {#if $connection && $connection.syn}",
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
    			add_location(li0, file$3, 16, 4, 463);
    			add_location(li1, file$3, 22, 4, 611);
    			add_location(li2, file$3, 23, 4, 686);
    			add_location(li3, file$3, 24, 4, 730);
    			add_location(li4, file$3, 25, 4, 762);
    			attr_dev(ul, "class", "svelte-1am20lw");
    			add_location(ul, file$3, 15, 2, 454);
    			add_location(div, file$3, 14, 0, 446);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Debug", slots, []);
    	const ctx = getContext("ctx");
    	const scribeStr = scribeStr_b(ctx);
    	validate_store(scribeStr, "scribeStr");
    	component_subscribe($$self, scribeStr, value => $$invalidate(3, $scribeStr = value));
    	const connection = connection_b(ctx);
    	validate_store(connection, "connection");
    	component_subscribe($$self, connection, value => $$invalidate(0, $connection = value));
    	const nextIndex = nextIndex_b(ctx);
    	validate_store(nextIndex, "nextIndex");
    	component_subscribe($$self, nextIndex, value => $$invalidate(2, $nextIndex = value));
    	const session = session_b(ctx);
    	validate_store(session, "session");
    	component_subscribe($$self, session, value => $$invalidate(1, $session = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Debug> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getContext,
    		nextIndex_b,
    		connection_b,
    		session_b,
    		scribeStr_b,
    		ctx,
    		scribeStr,
    		connection,
    		nextIndex,
    		session,
    		$connection,
    		$session,
    		$nextIndex,
    		$scribeStr
    	});

    	return [
    		$connection,
    		$session,
    		$nextIndex,
    		$scribeStr,
    		scribeStr,
    		connection,
    		nextIndex,
    		session
    	];
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

    /* src/HistoryEntry.svelte generated by Svelte v3.37.0 */

    const file$2 = "src/HistoryEntry.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let t;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(div, "class", div_class_value = "history-entry " + /*status*/ ctx[1] + " svelte-12sic9q");
    			add_location(div, file$2, 27, 0, 441);
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

    			if (dirty & /*status*/ 2 && div_class_value !== (div_class_value = "history-entry " + /*status*/ ctx[1] + " svelte-12sic9q")) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { text: 0, status: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HistoryEntry",
    			options,
    			id: create_fragment$2.name
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

    /* src/History.svelte generated by Svelte v3.37.0 */
    const file$1 = "src/History.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (72:4) {#each historyEntries as historyEntry}
    function create_each_block(ctx) {
    	let historyentry;
    	let current;

    	historyentry = new HistoryEntry({
    			props: {
    				status: /*historyEntry*/ ctx[14].status,
    				text: /*historyEntry*/ ctx[14].text
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
    			if (dirty & /*historyEntries*/ 1) historyentry_changes.status = /*historyEntry*/ ctx[14].status;
    			if (dirty & /*historyEntries*/ 1) historyentry_changes.text = /*historyEntry*/ ctx[14].text;
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
    		source: "(72:4) {#each historyEntries as historyEntry}",
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

    			attr_dev(div0, "class", "history-entries svelte-1718ppz");
    			add_location(div0, file$1, 70, 2, 2504);
    			attr_dev(div1, "class", "history svelte-1718ppz");
    			add_location(div1, file$1, 68, 0, 2469);
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
    	let $requestedChanges;
    	let $recordedChanges;
    	let $committedChanges;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("History", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	const ctx = getContext("ctx");
    	const requestedChanges = requestedChanges_b(ctx);
    	validate_store(requestedChanges, "requestedChanges");
    	component_subscribe($$self, requestedChanges, value => $$invalidate(8, $requestedChanges = value));
    	const recordedChanges = recordedChanges_b(ctx);
    	validate_store(recordedChanges, "recordedChanges");
    	component_subscribe($$self, recordedChanges, value => $$invalidate(9, $recordedChanges = value));
    	const committedChanges = committedChanges_b(ctx);
    	validate_store(committedChanges, "committedChanges");
    	component_subscribe($$self, committedChanges, value => $$invalidate(10, $committedChanges = value));
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
    	afterUpdate(() => __awaiter(void 0, void 0, void 0, function* () {
    		let entryElem = document.getElementsByClassName("history-entries")[0];

    		if (entryElem.firstChild !== null) {
    			entryElem.firstChild.scrollIntoView(false);
    		}
    	}));

    	const writable_props = ["changeToTextFn"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<History> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("changeToTextFn" in $$props) $$invalidate(4, changeToTextFn = $$props.changeToTextFn);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		afterUpdate,
    		getContext,
    		requestedChanges_b,
    		recordedChanges_b,
    		committedChanges_b,
    		HistoryEntry,
    		ctx,
    		requestedChanges,
    		recordedChanges,
    		committedChanges,
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
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("changeToTextFn" in $$props) $$invalidate(4, changeToTextFn = $$props.changeToTextFn);
    		if ("requestedH" in $$props) $$invalidate(5, requestedH = $$props.requestedH);
    		if ("recordedH" in $$props) $$invalidate(6, recordedH = $$props.recordedH);
    		if ("committedH" in $$props) $$invalidate(7, committedH = $$props.committedH);
    		if ("historyEntries" in $$props) $$invalidate(0, historyEntries = $$props.historyEntries);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$requestedChanges*/ 256) {
    			{
    				$$invalidate(5, requestedH = changesToEntriesList($requestedChanges, "requested"));
    			}
    		}

    		if ($$self.$$.dirty & /*$recordedChanges*/ 512) {
    			{
    				$$invalidate(6, recordedH = changesToEntriesList($recordedChanges, "recorded"));
    			}
    		}

    		if ($$self.$$.dirty & /*$committedChanges*/ 1024) {
    			{
    				$$invalidate(7, committedH = changesToEntriesList($committedChanges, "committed"));
    			}
    		}

    		if ($$self.$$.dirty & /*requestedH, recordedH, committedH*/ 224) {
    			{
    				$$invalidate(0, historyEntries = [...requestedH, ...recordedH, ...committedH]);
    			}
    		}
    	};

    	return [
    		historyEntries,
    		requestedChanges,
    		recordedChanges,
    		committedChanges,
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { changeToTextFn: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "History",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*changeToTextFn*/ ctx[4] === undefined && !("changeToTextFn" in props)) {
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

    /* src/App.svelte generated by Svelte v3.37.0 */

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
    	let syn_1;
    	let t5;
    	let div3;
    	let folks;
    	let t6;
    	let div5;
    	let div4;
    	let i;
    	let i_class_value;
    	let t7;
    	let div8;
    	let div6;
    	let t8;
    	let div7;
    	let history;
    	let t9;
    	let debug_1;
    	let current;
    	let mounted;
    	let dispose;
    	title = new Title({ $$inline: true });
    	title.$on("requestChange", /*requestChange_handler*/ ctx[14]);
    	editor = new Editor({ $$inline: true });
    	editor.$on("requestChange", /*requestChange_handler_1*/ ctx[15]);
    	let syn_1_props = { applyDeltaFn: applyDelta, undoFn: undo };
    	syn_1 = new Syn({ props: syn_1_props, $$inline: true });
    	/*syn_1_binding*/ ctx[16](syn_1);
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
    			create_component(syn_1.$$.fragment);
    			t5 = space();
    			div3 = element("div");
    			create_component(folks.$$.fragment);
    			t6 = space();
    			div5 = element("div");
    			div4 = element("div");
    			i = element("i");
    			t7 = space();
    			div8 = element("div");
    			div6 = element("div");
    			t8 = space();
    			div7 = element("div");
    			create_component(history.$$.fragment);
    			t9 = space();
    			create_component(debug_1.$$.fragment);
    			if (script.src !== (script_src_value = "https://kit.fontawesome.com/80d72fa568.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file, 280, 2, 7198);
    			attr_dev(h1, "class", "svelte-hss0sb");
    			add_location(h1, file, 284, 2, 7328);
    			toggle_class(div0, "noscribe", /*noscribe*/ ctx[5]);
    			add_location(div0, file, 285, 0, 7345);
    			attr_dev(div1, "class", "toolbar svelte-hss0sb");
    			add_location(div1, file, 283, 0, 7304);
    			toggle_class(div2, "noscribe", /*noscribe*/ ctx[5]);
    			add_location(div2, file, 290, 0, 7462);
    			attr_dev(main, "class", "svelte-hss0sb");
    			add_location(main, file, 289, 0, 7455);
    			attr_dev(div3, "class", "folks-tray svelte-hss0sb");
    			add_location(div3, file, 298, 0, 7638);

    			attr_dev(i, "class", i_class_value = "tab-icon fas " + (/*drawerHidden*/ ctx[3]
    			? "fa-chevron-up"
    			: "fa-chevron-down") + " svelte-hss0sb");

    			toggle_class(i, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			add_location(i, file, 305, 4, 7918);
    			attr_dev(div4, "class", "tab-inner svelte-hss0sb");
    			toggle_class(div4, "shown", /*tabShown*/ ctx[4]);
    			add_location(div4, file, 304, 2, 7813);
    			attr_dev(div5, "class", "tab svelte-hss0sb");
    			toggle_class(div5, "shown", /*tabShown*/ ctx[4]);
    			toggle_class(div5, "drawer-hidden", /*drawerHidden*/ ctx[3]);
    			add_location(div5, file, 302, 0, 7682);
    			attr_dev(div6, "class", "handle svelte-hss0sb");
    			add_location(div6, file, 310, 2, 8203);
    			attr_dev(div7, "class", "debug-content svelte-hss0sb");
    			add_location(div7, file, 311, 2, 8286);
    			attr_dev(div8, "class", "debug-drawer svelte-hss0sb");
    			toggle_class(div8, "hidden", /*drawerHidden*/ ctx[3]);
    			add_location(div8, file, 308, 0, 8051);
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
    			append_dev(main, t4);
    			mount_component(syn_1, main, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(folks, div3, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, i);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div6);
    			/*div6_binding*/ ctx[17](div6);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			mount_component(history, div7, null);
    			append_dev(div7, t9);
    			mount_component(debug_1, div7, null);
    			/*div8_binding*/ ctx[18](div8);
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

    			const syn_1_changes = {};
    			syn_1.$set(syn_1_changes);

    			if (!current || dirty & /*drawerHidden*/ 8 && i_class_value !== (i_class_value = "tab-icon fas " + (/*drawerHidden*/ ctx[3]
    			? "fa-chevron-up"
    			: "fa-chevron-down") + " svelte-hss0sb")) {
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

    			if (dirty & /*drawerHidden*/ 8) {
    				toggle_class(div8, "hidden", /*drawerHidden*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(editor.$$.fragment, local);
    			transition_in(syn_1.$$.fragment, local);
    			transition_in(folks.$$.fragment, local);
    			transition_in(history.$$.fragment, local);
    			transition_in(debug_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(editor.$$.fragment, local);
    			transition_out(syn_1.$$.fragment, local);
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
    			/*syn_1_binding*/ ctx[16](null);
    			destroy_component(syn_1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div3);
    			destroy_component(folks);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div8);
    			/*div6_binding*/ ctx[17](null);
    			destroy_component(history);
    			destroy_component(debug_1);
    			/*div8_binding*/ ctx[18](null);
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

    // definition of how to apply a delta to the content
    // if the delta is destructive also returns what was
    // destroyed for use by undo
    function applyDelta(content, in_delta) {
    	switch (in_delta.type) {
    		case "Title":
    			{
    				const deleted = content.title;
    				const delta = in_delta;
    				content.title = delta.value;
    				return [content, { delta, deleted }];
    			}
    		case "Add":
    			{
    				const delta = in_delta;
    				const [loc, text] = delta.value;
    				content.body = content.body.slice(0, loc) + text + content.body.slice(loc);
    				return [content, { delta }];
    			}
    		case "Delete":
    			{
    				const delta = in_delta;
    				const [start, end] = delta.value;
    				const deleted = content.body.slice(start, end);
    				content.body = content.body.slice(0, start) + content.body.slice(end);
    				return [content, { delta, deleted }];
    			}
    		case "Meta":
    			{
    				const delta = in_delta;
    				const [tag, loc] = delta.value.setLoc;
    				const deleted = [tag, content.meta[tag]];
    				content.meta[tag] = loc;
    				return [content, { delta, deleted }];
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

    function instance($$self, $$props, $$invalidate) {
    	let disconnected;
    	let noscribe;
    	let $scribeStr;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	
    	
    	let ctx = {};
    	setContext("ctx", ctx);
    	const scribeStr = scribeStr_b(ctx);
    	validate_store(scribeStr, "scribeStr");
    	component_subscribe($$self, scribeStr, value => $$invalidate(13, $scribeStr = value));
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

    		window.addEventListener("pointermove", mouseDragHandler);
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const requestChange_handler = event => syn.requestChange(event.detail);
    	const requestChange_handler_1 = event => syn.requestChange(event.detail);

    	function syn_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			syn = $$value;
    			$$invalidate(0, syn);
    		});
    	}

    	function div6_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			resizeHandle = $$value;
    			$$invalidate(2, resizeHandle);
    		});
    	}

    	function div8_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			resizeable = $$value;
    			$$invalidate(1, resizeable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		setContext,
    		Editor,
    		Title,
    		Folks,
    		Syn,
    		Debug,
    		History,
    		scribeStr_b,
    		ctx,
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
    		disconnected,
    		noscribe,
    		$scribeStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("syn" in $$props) $$invalidate(0, syn = $$props.syn);
    		if ("resizeable" in $$props) $$invalidate(1, resizeable = $$props.resizeable);
    		if ("resizeHandle" in $$props) $$invalidate(2, resizeHandle = $$props.resizeHandle);
    		if ("drawerHidden" in $$props) $$invalidate(3, drawerHidden = $$props.drawerHidden);
    		if ("tabShown" in $$props) $$invalidate(4, tabShown = $$props.tabShown);
    		if ("disconnected" in $$props) disconnected = $$props.disconnected;
    		if ("noscribe" in $$props) $$invalidate(5, noscribe = $$props.noscribe);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$scribeStr*/ 8192) {
    			$$invalidate(5, noscribe = $scribeStr === "");
    		}
    	};

    	disconnected = false;

    	return [
    		syn,
    		resizeable,
    		resizeHandle,
    		drawerHidden,
    		tabShown,
    		noscribe,
    		scribeStr,
    		initResizeable,
    		startDragging,
    		hideDrawer,
    		showDrawer,
    		showTab,
    		hideTab,
    		$scribeStr,
    		requestChange_handler,
    		requestChange_handler_1,
    		syn_1_binding,
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
        props: {}
    });

    return app;

}());
//# sourceMappingURL=main.js.map
