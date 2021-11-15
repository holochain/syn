import { html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { CodemirrorMarkdown } from '@scoped-elements/codemirror';
import {
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';
import {
  sharedStyles,
  synContext,
  synSessionContext,
  getFolkColors,
} from '@syn/elements';
import { contextProvided } from '@lit-labs/context';
import type { SessionStore, SynSlice, SynStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';

import { TextEditorDeltaType, TextEditorEngine } from './engine';
import type { TextEditorDelta } from './engine';
import { moveCursors } from './utils';

export class SynTextEditor extends ScopedElementsMixin(LitElement) {
  @property()
  synSlice!: SynSlice<TextEditorEngine>;

  @property({ attribute: 'debounce-ms' })
  debounceMs: number = 200;

  @contextProvided({ context: synContext, multiple: true })
  @state()
  synStore!: SynStore<any>;

  @contextProvided({ context: synSessionContext, multiple: true })
  @state()
  sessionStore!: SessionStore<any>;

  @contextProvided({ context: profilesStoreContext, multiple: true })
  @state()
  profilesStore!: ProfilesStore;

  _content = new StoreSubscriber(this, () => this.synSlice?.content);
  _ephemeral = new StoreSubscriber(this, () => this.synSlice?.ephemeral);
  _allProfiles = new StoreSubscriber(
    this,
    () => this.profilesStore?.knownProfiles
  );

  _deltasNotEmmitted: TextEditorDelta[] = [];
  _lastCursorPosition = 0;
  _cursorPosition = 0;

  firstUpdated() {
    setInterval(() => this.emitDeltas(), this.debounceMs);
  }

  updated(cv: PropertyValues) {
    super.updated(cv);

    if (cv.has('sessionStore') && this.sessionStore) {
      this.sessionStore.folks.subscribe(
        folks =>
          folks && this.profilesStore.fetchAgentsProfiles(Object.keys(folks))
      );
    }
  }

  emitDeltas() {
    if (
      this._deltasNotEmmitted.length === 0 &&
      this._cursorPosition === this._lastCursorPosition
    )
      return;

    this.synSlice.requestChanges({
      deltas: this._deltasNotEmmitted,
      ephemeral: [
        {
          agent: this.synStore.myPubKey,
          position: this._cursorPosition,
        },
        ...moveCursors(this._deltasNotEmmitted, this._ephemeral.value),
      ],
    });

    this._deltasNotEmmitted = [];
    this._lastCursorPosition = this._cursorPosition;
  }

  onTextInserted(from: number, text: string) {
    this._deltasNotEmmitted.push({
      type: TextEditorDeltaType.Insert,
      text: text,
      position: from,
    });
  }

  onTextDeleted(from: number, characterCount: number) {
    this._deltasNotEmmitted.push({
      type: TextEditorDeltaType.Delete,
      position: from,
      characterCount,
    });
  }

  onSelectionChanged(ranges: Array<{ from: number; to: number }>) {
    this._cursorPosition = ranges[0].to;
  }

  remoteCursors() {
    if (!this._ephemeral.value) return [];
    return Object.entries(this._ephemeral.value as any)
      .filter(([pubKey, _]) => pubKey !== this.synStore.myPubKey)
      .map(([agentPubKey, position]) => {
        const { r, g, b } = getFolkColors(agentPubKey);

        const name = this._allProfiles.value[agentPubKey]?.nickname;
        return {
          position,
          color: `${r} ${g} ${b}`,
          name: name || 'Loading...',
        };
      });
  }

  render() {
    if (this._content.value === undefined) return html``;

    return html`
      <div
        class="flex-scrollable-parent"
        style="background-color: rgb(40, 44, 52);"
      >
        <div class="flex-scrollable-container">
          <div class="flex-scrollable-y">
            <codemirror-markdown
              style="flex: 1; "
              id="editor"
              .text=${this._content.value}
              .additionalCursors=${this.remoteCursors()}
              @text-inserted=${e =>
                this.onTextInserted(e.detail.from, e.detail.text)}
              @text-deleted=${e =>
                this.onTextDeleted(e.detail.from, e.detail.characterCount)}
              @selection-changed=${e =>
                this.onSelectionChanged(e.detail.ranges)}
            ></codemirror-markdown>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [sharedStyles];

  static get scopedElements() {
    return {
      'codemirror-markdown': CodemirrorMarkdown,
    };
  }
}
