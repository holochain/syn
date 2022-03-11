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
} from '@holochain-syn/elements';
import { contextProvided } from '@holochain-open-dev/context';
import type { SessionStore, SynSlice, SynStore } from '@holochain-syn/store';
import { StoreSubscriber } from 'lit-svelte-stores';

import { TextEditorDeltaType, TextEditorGrammar } from './grammar';
import type { TextEditorDelta } from './grammar';

export class SynTextEditor extends ScopedElementsMixin(LitElement) {
  @property()
  synSlice!: SynSlice<TextEditorGrammar>;

  @property({ attribute: 'debounce-ms' })
  debounceMs: number = 1000;

  @contextProvided({ context: synContext, multiple: true })
  @state()
  synStore!: SynStore<any>;

  @contextProvided({ context: synSessionContext, multiple: true })
  @state()
  sessionStore!: SessionStore<any>;

  @contextProvided({ context: profilesStoreContext, multiple: true })
  @state()
  profilesStore!: ProfilesStore;

  _state = new StoreSubscriber(this, () => this.synSlice?.state);
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

  onTextInserted(from: number, text: string) {
    this.synSlice.requestChanges([
      {
        type: TextEditorDeltaType.Insert,
        position: from,
        text: text,
      },
    ]);
  }

  onTextDeleted(from: number, characterCount: number) {
    this.synSlice.requestChanges([
      {
        type: TextEditorDeltaType.Delete,
        position: from,
        characterCount,
      },
    ]);
  }

  onSelectionChanged(ranges: Array<{ from: number; to: number }>) {
    this.synSlice.requestChanges([
      {
        type: TextEditorDeltaType.ChangeSelection,
        position: ranges[0].from,
        characterCount: ranges[0].to - ranges[0].from,
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
          position: position.position,
          color: `${r} ${g} ${b}`,
          name: name || 'Loading...',
        };
      });
  }

  render() {
    if (this._state.value === undefined) return html``;

    const mySelection = this._state.value.selections[this.synStore.myPubKey];

    const selection = mySelection
      ? {
          from: mySelection.position,
          to: mySelection.position + mySelection.characterCount,
        }
      : undefined;

    console.log(this._state.value.text, selection);

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
                selection,
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
