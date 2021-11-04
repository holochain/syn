import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { LitElement, PropertyValues } from 'lit';
import type { SessionStore, SynStore } from '@syn/store';
import { Context, ContextProvider } from '@lit-labs/context';
declare const SynSessionContext_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class SynSessionContext extends SynSessionContext_base {
    sessionHash: EntryHashB64;
    synStore: SynStore<any, any>;
    provider: ContextProvider<Context<SessionStore<any, any> | undefined>>;
    connectedCallback(): void;
    update(changedValues: PropertyValues): void;
    render(): import("lit-html").TemplateResult<1>;
    static get styles(): import("lit").CSSResult;
}
export {};
