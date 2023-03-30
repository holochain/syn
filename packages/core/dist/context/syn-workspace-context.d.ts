import { LitElement } from 'lit';
import type { WorkspaceStore } from '@holochain-syn/store';
declare const SynWorkspaceContext_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class SynWorkspaceContext extends SynWorkspaceContext_base {
    workspacestore: WorkspaceStore<any>;
    render(): import("lit-html").TemplateResult<1>;
    static get styles(): import("lit").CSSResult;
}
export {};
