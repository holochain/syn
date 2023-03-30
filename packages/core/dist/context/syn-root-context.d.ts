import { LitElement } from 'lit';
import { RootStore } from '@holochain-syn/store';
declare const SynRootContext_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class SynRootContext extends SynRootContext_base {
    rootstore: RootStore<any>;
    render(): import("lit-html").TemplateResult<1>;
    static get styles(): import("lit").CSSResult;
}
export {};
