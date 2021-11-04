import { LitElement, PropertyValues } from 'lit';
import type { SessionStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import type Quill from 'quill';
import type { Sources } from 'quill';
import { QuillSnow } from '@scoped-elements/quill';
declare const SynTextEditor_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class SynTextEditor<CONTENT> extends SynTextEditor_base {
    contentPath: string;
    sessionStore: SessionStore<CONTENT, any>;
    _content: StoreSubscriber<CONTENT>;
    onTextChanged(deltas: any, source: Sources): void;
    get quill(): Quill;
    updated(changedValues: PropertyValues): void;
    getContent(): string;
    render(): import("lit-html").TemplateResult<1>;
    static get scopedElements(): {
        'quill-snow': typeof QuillSnow;
    };
    static styles: import("lit").CSSResult[];
}
export {};
