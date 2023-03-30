import { LitElement } from 'lit';
import type { SynStore } from '@holochain-syn/store';
declare const SynContext_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
export declare class SynContext extends SynContext_base {
    synstore: SynStore;
    render(): import("lit-html").TemplateResult<1>;
    static get styles(): import("lit").CSSResult;
}
export {};
