/// <reference types="automerge" />
import { LitElement, PropertyValues } from 'lit';
import { CodemirrorMarkdown } from '@scoped-elements/codemirror';
import { Profile, ProfilesStore } from '@holochain-open-dev/profiles';
import { SliceStore } from '@holochain-syn/core';
import { StoreSubscriber, TaskSubscriber } from 'lit-svelte-stores';
import { AgentPubKeyMap } from '@holochain-open-dev/utils';
import { TextEditorGrammar } from './grammar';
declare const SynMarkdownEditor_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types/src/types").ScopedElementsHost>;
export declare class SynMarkdownEditor extends SynMarkdownEditor_base {
    slice: SliceStore<TextEditorGrammar>;
    debounceMs: number;
    profilesStore: ProfilesStore;
    _state: StoreSubscriber<import("automerge").FreezeObject<import("./grammar").TextEditorState>>;
    _cursors: StoreSubscriber<import("./grammar").TextEditorEphemeralState>;
    _peersProfiles: AgentPubKeyMap<TaskSubscriber<[], Profile | undefined>>;
    _lastCursorPosition: number;
    _cursorPosition: number;
    updated(cv: PropertyValues): void;
    onTextInserted(from: number, text: string): void;
    onTextDeleted(from: number, characterCount: number): void;
    onSelectionChanged(ranges: Array<{
        from: number;
        to: number;
    }>): void;
    remoteCursors(): {
        position: number | undefined;
        color: string;
        name: string;
    }[];
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult[];
    static get scopedElements(): {
        'codemirror-markdown': typeof CodemirrorMarkdown;
    };
}
export {};
