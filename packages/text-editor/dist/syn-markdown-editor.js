var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { CodemirrorMarkdown } from '@scoped-elements/codemirror';
import { profilesStoreContext, } from '@holochain-open-dev/profiles';
import { sharedStyles, getFolkColors, } from '@holochain-syn/core';
import { contextProvided } from '@lit-labs/context';
import { StoreSubscriber, TaskSubscriber } from 'lit-svelte-stores';
import { AgentPubKeyMap } from '@holochain-open-dev/utils';
import { TextEditorDeltaType } from './grammar';
import { elemIdToPosition } from './utils';
import { decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
export class SynMarkdownEditor extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this.debounceMs = 1000;
        this._state = new StoreSubscriber(this, () => this.slice.state);
        this._cursors = new StoreSubscriber(this, () => this.slice.ephemeral);
        this._peersProfiles = new AgentPubKeyMap();
        this._lastCursorPosition = 0;
        this._cursorPosition = 0;
    }
    updated(cv) {
        super.updated(cv);
        if (cv.has('slice') && this.slice) {
            this.slice.worskpace.participants.subscribe(participants => {
                const allFolksPubKey = [...participants.active, ...participants.idle];
                const unknownPeers = allFolksPubKey.filter(pubKey => !this._peersProfiles.has(pubKey));
                for (const peer of unknownPeers) {
                    this._peersProfiles.put(peer, new TaskSubscriber(this, () => this.profilesStore.fetchAgentProfile(peer)));
                }
            });
        }
    }
    onTextInserted(from, text) {
        this.slice.requestChanges([
            {
                type: TextEditorDeltaType.Insert,
                position: from,
                text: text,
            },
        ]);
    }
    onTextDeleted(from, characterCount) {
        this.slice.requestChanges([
            {
                type: TextEditorDeltaType.Delete,
                position: from,
                characterCount,
            },
        ]);
    }
    onSelectionChanged(ranges) {
        this.slice.requestChanges([
            {
                type: TextEditorDeltaType.ChangeSelection,
                position: ranges[0].from,
                characterCount: ranges[0].to - ranges[0].from,
            },
        ]);
    }
    remoteCursors() {
        const myPubKey = encodeHashToBase64(this.slice.myPubKey);
        if (!this._cursors.value)
            return [];
        return Object.entries(this._cursors.value)
            .filter(([pubKey, _]) => pubKey !== myPubKey)
            .map(([agentPubKey, position]) => {
            var _a, _b;
            const { r, g, b } = getFolkColors(agentPubKey);
            const name = (_b = (_a = this._peersProfiles.get(decodeHashFromBase64(agentPubKey))) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.nickname;
            return {
                position: elemIdToPosition(position.left, position.position, this._state.value.text),
                color: `${r} ${g} ${b}`,
                name: name || 'Loading...',
            };
        });
    }
    render() {
        if (this._state.value === undefined)
            return html ``;
        const mySelection = this._cursors.value[encodeHashToBase64(this.slice.myPubKey)];
        const myPosition = mySelection &&
            elemIdToPosition(mySelection.left, mySelection.position, this._state.value.text);
        const selection = myPosition
            ? {
                from: myPosition,
                to: myPosition + mySelection.characterCount,
            }
            : undefined;
        return html `
      <div
        class="flex-scrollable-parent"
        style="background-color: rgb(40, 44, 52);"
      >
        <div class="flex-scrollable-container">
          <div class="flex-scrollable-y">
            <codemirror-markdown
              style="flex: 1; "
              id="editor"
              .state=${{
            text: this._state.value.text.toString(),
            selection,
        }}
              .additionalCursors=${this.remoteCursors()}
              @text-inserted=${e => this.onTextInserted(e.detail.from, e.detail.text)}
              @text-deleted=${e => this.onTextDeleted(e.detail.from, e.detail.characterCount)}
              @selection-changed=${e => this.onSelectionChanged(e.detail.ranges)}
            ></codemirror-markdown>
          </div>
        </div>
      </div>
    `;
    }
    static get scopedElements() {
        return {
            'codemirror-markdown': CodemirrorMarkdown,
        };
    }
}
SynMarkdownEditor.styles = [sharedStyles];
__decorate([
    property({ type: Object })
], SynMarkdownEditor.prototype, "slice", void 0);
__decorate([
    property({ attribute: 'debounce-ms' })
], SynMarkdownEditor.prototype, "debounceMs", void 0);
__decorate([
    contextProvided({ context: profilesStoreContext, subscribe: true }),
    state()
], SynMarkdownEditor.prototype, "profilesStore", void 0);
//# sourceMappingURL=syn-markdown-editor.js.map