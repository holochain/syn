import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { LitElement } from 'lit';
declare const SynFolk_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class SynFolk extends SynFolk_base {
    pubKey: AgentPubKeyB64;
    inSession: boolean;
    isScribe: boolean;
    render(): import("lit-html").TemplateResult<1>;
    static get styles(): import("lit").CSSResult;
}
export {};
