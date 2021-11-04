import { LitElement } from 'lit';
import type { SessionStore, SynStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import { SynFolk } from './syn-folk';
declare const SynFolks_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class SynFolks extends SynFolks_base {
    syn: SynStore<any, any>;
    sessionStore: SessionStore<any, any>;
    _folks: StoreSubscriber<import("@holochain-open-dev/core-types").Dictionary<import("@syn/store").SessionFolk>>;
    render(): import("lit-html").TemplateResult<1>;
    static get scopedElements(): {
        'syn-folk': typeof SynFolk;
    };
    static get styles(): import("lit").CSSResult;
}
export {};
