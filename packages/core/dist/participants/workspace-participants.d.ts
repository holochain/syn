import { LitElement } from 'lit';
import type { WorkspaceStore } from '@holochain-syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import { AgentPubKey } from '@holochain/client';
import { AgentAvatar } from '@holochain-open-dev/profiles';
declare const WorkspaceParticipants_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class WorkspaceParticipants extends WorkspaceParticipants_base {
    workspacestore: WorkspaceStore<any>;
    direction: 'column' | 'row';
    _participants: StoreSubscriber<{
        active: Uint8Array[];
        idle: Uint8Array[];
        offline: Uint8Array[];
    }>;
    renderParticipant(pubKey: AgentPubKey, idle: boolean): import("lit-html").TemplateResult<1>;
    render(): import("lit-html").TemplateResult<1>;
    static get scopedElements(): {
        'agent-avatar': typeof AgentAvatar;
    };
    static get styles(): import("lit").CSSResult[];
}
export {};
