import { LitElement } from 'lit';
import type { SynStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';
import { List, ListItem, Button, CircularProgress } from '@scoped-elements/material-web';
import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import { SynFolk } from '../folks/syn-folk';
import type { Session } from '@syn/zome-client';
declare const SynSessions_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class SynSessions extends SynSessions_base {
    syn: SynStore<any, any>;
    _allSessions: StoreSubscriber<import("@holochain-open-dev/core-types").Dictionary<Session>>;
    _joinedSessions: StoreSubscriber<string[]>;
    _loaded: boolean;
    firstUpdated(): Promise<void>;
    joinSession(sessionHash: EntryHashB64): Promise<void>;
    renderSession(sessionHash: EntryHashB64, session: Session): import("lit-html").TemplateResult<1>;
    render(): import("lit-html").TemplateResult<1>;
    static get scopedElements(): {
        'mwc-list': typeof List;
        'mwc-list-item': typeof ListItem;
        'mwc-button': typeof Button;
        'syn-folk': typeof SynFolk;
        'mwc-circular-progress': typeof CircularProgress;
    };
    static get styles(): import("lit").CSSResult;
}
export {};
