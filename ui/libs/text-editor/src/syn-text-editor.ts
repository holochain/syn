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
import { DebouncingStore } from '@syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';

import {
  TextEditorDeltaType,
  textEditorGrammar,
  TextEditorGrammar,
} from './grammar';
import type { TextEditorDelta } from './grammar';

export class SynTextEditor extends ScopedElementsMixin(LitElement) {
  @property()
  synSlice!: SynSlice<TextEditorGrammar>;

  @property({ attribute: 'debounce-ms' })
  debounceMs: number = 500;

  @contextProvided({ context: synContext, multiple: true })
  @state()
  synStore!: SynStore<any>;

  @contextProvided({ context: synSessionContext, multiple: true })
  @state()
  sessionStore!: SessionStore<any>;

  @contextProvided({ context: profilesStoreContext, multiple: true })
  @state()
  profilesStore!: ProfilesStore;

  _debouncingStore!: DebouncingStore<TextEditorGrammar>;

  _state = new StoreSubscriber(this, () => this._debouncingStore?.state);
  _lastDelta: TextEditorDelta | undefined;
  _allProfiles = new StoreSubscriber(
    this,
    () => this.profilesStore?.knownProfiles
  );

  _lastCursorPosition = 0;
  _cursorPosition = 0;

  updated(cv: PropertyValues) {
    super.updated(cv);
    if (cv.has('sessionStore') && this.sessionStore) {
      this.sessionStore.folks.subscribe(
        folks =>
          folks && this.profilesStore.fetchAgentsProfiles(Object.keys(folks))
      );
    }
  }

  firstUpdated() {
    this._debouncingStore = new DebouncingStore(
      textEditorGrammar,
      this.synStore.myPubKey,
      this.synSlice,
      500
    );
  }

  onTextInserted(from: number, text: string) {
    this._debouncingStore.requestChanges([
      {
        type: TextEditorDeltaType.Insert,
        position: from,
        text: text,
      },
    ]);
  }

  onTextDeleted(from: number, characterCount: number) {
    this._debouncingStore.requestChanges([
      {
        type: TextEditorDeltaType.Delete,
        position: from,
        characterCount,
      },
    ]);
  }

  onSelectionChanged(ranges: Array<{ from: number; to: number }>) {
    this._debouncingStore.requestChanges([
      {
        type: TextEditorDeltaType.ChangeSelection,
        position: ranges[0].from,
        to: ranges[0].to,
      },
    ]);
  }

  remoteCursors() {
    if (!this._state.value) return [];
    return Object.entries(this._state.value.selections)
      .filter(([pubKey, _]) => pubKey !== this.synStore.myPubKey)
      .map(([agentPubKey, position]) => {
        const { r, g, b } = getFolkColors(agentPubKey);

        const name = this._allProfiles.value[agentPubKey]?.nickname;
        return {
          position: position.from,
          color: `${r} ${g} ${b}`,
          name: name || 'Loading...',
        };
      });
  }

  render() {
    if (this._state.value === undefined) return html``;

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
              .state=${{
                text: this._state.value.text,
                selection: this._state.value.selections[this.synStore.myPubKey],
              }}
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
