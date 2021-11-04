import { LitElement, PropertyValues } from 'lit';
import type { SynStore } from '@syn/store';
import { Context, ContextProvider } from '@lit-labs/context';
import { StoreSubscriber } from 'lit-svelte-stores';
import { SynSessionContext } from './syn-session-context';
declare const SynContext_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
/**
 * Context provider element to serve as a container for all the
 * other syn elements
 */
export declare class SynContext extends SynContext_base {
    store: SynStore<any, any>;
    _activeSession: StoreSubscriber<import("@syn/store").SessionStore<any, any> | undefined>;
    provider: ContextProvider<Context<SynStore<any, any> | undefined>>;
    connectedCallback(): void;
    update(changedValues: PropertyValues): void;
    render(): import("lit-html").TemplateResult<1>;
    static get styles(): import("lit").CSSResult;
    static get scopedElements(): {
        'syn-session-context': typeof SynSessionContext;
    };
}
export {};
